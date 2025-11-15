// =============================================================
// FILE: src/modules/storage/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import { sql as dsql } from "drizzle-orm";

import {
  storageListQuerySchema,
  storageUpdateSchema,
  type StorageListQuery,
  type StorageUpdateInput,
} from "./validation";

import {
  getCloudinaryConfig,
  uploadBufferAuto,
  destroyCloudinaryById,
  renameCloudinaryPublicId,
  type UploadResult,
} from "./cloudinary";

import { env } from "@/core/env";
import { normalizeFolder } from "./util";
import {
  listAndCount,
  getById,
  getByBucketPath,
  getByIds,
  insert as repoInsert,
  updateById as repoUpdateById,
  deleteById as repoDeleteById,
  deleteManyByIds as repoDeleteManyByIds,
  isDup,
} from "./repository";

/* --------------------------------- utils ---------------------------------- */

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");

/** NULL/undefined alanları INSERT’ten at */
const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

/** Public URL normalizasyonu (Cloudinary URL varsa onu kullan) */
function publicUrlOf(
  bucket: string,
  path: string,
  providerUrl?: string | null,
): string {
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

/** Dosya adı sanitize */
const sanitizeName = (name: string) => name.replace(/[^\w.\-]+/g, "_");

/* ---------------------------------- ADMIN ---------------------------------- */

/** GET /admin/storage/assets */
export const adminListAssets: RouteHandler<{ Querystring: unknown }> = async (
  req,
  reply,
) => {
  const parsed = storageListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }
  const q = parsed.data as StorageListQuery;

  const { rows, total } = await listAndCount(q);

  // toplamı FE için header'a yaz
  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header(
    "access-control-expose-headers",
    "x-total-count, content-range",
  );

  return reply.send(rows);
};

/** GET /admin/storage/assets/:id */
export const adminGetAsset: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply,
) => {
  const row = await getById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ ...row, url: publicUrlOf(row.bucket, row.path, row.url) });
};

/** POST /admin/storage/assets (multipart single file) */
export const adminCreateAsset: RouteHandler = async (req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return reply.code(501).send({ message: "cloudinary_not_configured" });

  const mp: MultipartFile | undefined = await (req as any).file();
  if (!mp) return reply.code(400).send({ message: "file_required" });

  const buf = await mp.toBuffer();

  const fields = mp.fields as Record<string, MultipartValue>;
  const s = (k: string): string | undefined =>
    fields[k] ? String(fields[k].value) : undefined;

  const bucket = s("bucket") ?? "default";
  const folder =
    normalizeFolder(s("folder") ?? cfg.defaultFolder ?? null) ?? undefined;

  let metadata: Record<string, string> | null = null;
  const metaRaw = s("metadata");
  if (metaRaw) {
    try {
      metadata = JSON.parse(metaRaw) as Record<string, string>;
    } catch {
      metadata = null;
    }
  }

  const cleanName = sanitizeName(mp.filename || "file");
  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

  // 1) Upload
  let up: UploadResult;
  try {
    up = await uploadBufferAuto(cfg, buf, {
      folder,
      publicId: publicIdBase,
      mime: mp.mimetype,
    });
  } catch (e) {
    const err = e as {
      http_code?: number;
      name?: string;
      message?: string;
      error?: unknown;
      response?: unknown;
    };
    const http = Number(err?.http_code) || 502;
    return reply
      .code(http >= 400 && http < 500 ? http : 502)
      .send({
        error: {
          where: "cloudinary_upload",
          name: err?.name,
          message: err?.message,
          http_code: err?.http_code,
          cld_error: err?.error || err?.response || null,
        },
      });
  }

  // 2) DB
  const path = folder ? `${folder}/${cleanName}` : cleanName;
  const size = typeof up.bytes === "number" ? up.bytes : buf.length;
  const width = typeof up.width === "number" ? up.width : null;
  const height = typeof up.height === "number" ? up.height : null;
  const etagRaw = up.etag ?? null;
  const etag = typeof etagRaw === "string" ? etagRaw.slice(0, 64) : null;

  const provider_resource_type = (up.resource_type || "image") as string;
  const provider_format = (up.format || null) as string | null;
  const provider_version = typeof up.version === "number" ? up.version : null;

  const recId = randomUUID();
  const provider = env.STORAGE_DRIVER === "local" ? "local" : "cloudinary";

  const base = {
    id: recId,
    user_id: (req as any).user?.id ? String((req as any).user.id) : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size,
    width,
    height,
    url: up.secure_url || null,
    hash: etag,
    etag,
    provider,
    provider_public_id: up.public_id ?? null,
    provider_resource_type,
    provider_format,
    provider_version,
    metadata,
  };

  try {
    await repoInsert(omitNullish(base));
  } catch (e) {
    const err = e as { message?: string; code?: string; errno?: string; cause?: unknown };
    if (isDup(err)) {
      const existing = await getByBucketPath(bucket, path);
      if (existing) {
        return reply.code(200).send({
          ...existing,
          url: publicUrlOf(existing.bucket, existing.path, existing.url),
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        });
      }
    }
    return reply.code(502).send({
      error: {
        where: "db_insert",
        message: err?.message || "db_insert_failed",
        code: err?.code || err?.errno || null,
        cause: err?.cause || null,
      },
    });
  }

  return reply.code(201).send({
    ...base,
    url: publicUrlOf(base.bucket, base.path, base.url),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

/** PATCH /admin/storage/assets/:id (rename folder/name + metadata) */
export const adminPatchAsset: RouteHandler<{
  Params: { id: string };
  Body: StorageUpdateInput;
}> = async (req, reply) => {
  const parsed = storageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }
  const patch = parsed.data;

  const cur = await getById(req.params.id);
  if (!cur) return reply.code(404).send({ error: { message: "not_found" } });

  const targetFolder =
    typeof patch.folder !== "undefined"
      ? normalizeFolder(patch.folder)
      : cur.folder ?? null;
  const targetName =
    typeof patch.name !== "undefined" ? sanitizeName(patch.name) : cur.name;

  const folderChanged = targetFolder !== (cur.folder ?? null);
  const nameChanged = targetName !== cur.name;

  const sets: Record<string, unknown> = {
    updated_at: dsql`CURRENT_TIMESTAMP(3)`,
  };

  if (folderChanged || nameChanged) {
    if (cur.provider_public_id) {
      const baseName = targetName.replace(/^\//, "").replace(/\.[^.]+$/, "");
      const newPublicId = targetFolder ? `${targetFolder}/${baseName}` : baseName;

      const renamed = await renameCloudinaryPublicId(
        cur.provider_public_id,
        newPublicId,
        cur.provider_resource_type || "image",
      );

      sets.name = targetName;
      sets.folder = targetFolder;
      sets.path = targetFolder ? `${targetFolder}/${targetName}` : targetName;
      sets.provider_public_id = renamed.public_id ?? newPublicId;
      sets.url = renamed.secure_url ?? cur.url;
      sets.provider_version =
        typeof renamed.version === "number"
          ? renamed.version
          : cur.provider_version;
      sets.provider_format = renamed.format ?? cur.provider_format;
    } else {
      // sadece DB
      sets.name = targetName;
      sets.folder = targetFolder;
      sets.path = targetFolder ? `${targetFolder}/${targetName}` : targetName;
    }
  } else {
    if (typeof patch.name !== "undefined") sets.name = targetName;
    if (typeof patch.folder !== "undefined") sets.folder = targetFolder;
  }

  if (typeof patch.metadata !== "undefined")
    sets.metadata = patch.metadata ?? null;

  await repoUpdateById(req.params.id, sets);
  const fresh = await getById(req.params.id);
  if (!fresh) return reply.code(404).send({ error: { message: "not_found" } });

  return reply.send({
    ...fresh,
    url: publicUrlOf(fresh.bucket, fresh.path, fresh.url),
  });
};

/** DELETE /admin/storage/assets/:id (Cloudinary + DB) */
export const adminDeleteAsset: RouteHandler<{
  Params: { id: string };
}> = async (req, reply) => {
  const row = await getById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  try {
    const publicId = row.provider_public_id || row.path.replace(/\.[^.]+$/, "");
    await destroyCloudinaryById(publicId, row.provider_resource_type || undefined);
  } catch {
    // provider tarafı silinmese bile DB'den silmeye devam
  }

  await repoDeleteById(req.params.id);
  return reply.code(204).send();
};

/** POST /admin/storage/assets/bulk-delete { ids: string[] } */
export const adminBulkDelete: RouteHandler<{
  Body: { ids: string[] };
}> = async (req, reply) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.filter(Boolean)
    : [];
  if (!ids.length) return reply.send({ deleted: 0 });

  const rows = await getByIds(ids);
  if (!rows.length) return reply.send({ deleted: 0 });

  // Her asset için provider tarafını sil (Cloudinary veya local)
  for (const r of rows) {
    const pid = r.provider_public_id || r.path.replace(/\.[^.]+$/, "");
    try {
      await destroyCloudinaryById(pid, r.provider_resource_type || undefined);
    } catch {
      // provider'ı silmesek bile DB'den silmeye devam
    }
  }

  await repoDeleteManyByIds(rows.map((r) => r.id));
  return reply.send({ deleted: rows.length });
};

/** POST /admin/storage/assets/bulk (multipart mixed: fields + files...) */
export const adminBulkCreateAssets: RouteHandler = async (req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return reply.code(501).send({ message: "cloudinary_not_configured" });

  const partsIt =
    typeof (req as any).parts === "function" ? (req as any).parts() : null;
  if (!partsIt || typeof partsIt[Symbol.asyncIterator] !== "function") {
    return reply.code(400).send({ message: "multipart_required" });
  }

  // Form-level defaults
  let formBucket: string | undefined;
  let formFolder: string | null | undefined;
  let formMeta: Record<string, string> | null = null;

  const out: unknown[] = [];

  for await (const part of partsIt) {
    if (part.type === "field") {
      if (part.fieldname === "bucket") formBucket = String(part.value);
      if (part.fieldname === "folder")
        formFolder = normalizeFolder(String(part.value));
      if (part.fieldname === "metadata") {
        try {
          formMeta = JSON.parse(String(part.value));
        } catch {
          formMeta = null;
        }
      }
      continue;
    }
    if (part.type !== "file") continue;

    const buf = await part.toBuffer();
    const bucket = formBucket || "default";
    const folder = formFolder ?? undefined;

    const cleanName = sanitizeName(part.filename || "file");
    const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

    let up: UploadResult;
    try {
      up = await uploadBufferAuto(cfg, buf, {
        folder,
        publicId: publicIdBase,
        mime: part.mimetype,
      });
    } catch (e) {
      const err = e as { message?: string; http_code?: number };
      out.push({
        file: cleanName,
        error: {
          where: "cloudinary_upload",
          message: err?.message,
          http: err?.http_code ?? null,
        },
      });
      continue;
    }

    const path = folder ? `${folder}/${cleanName}` : cleanName;
    const recId = randomUUID();
    const provider = env.STORAGE_DRIVER === "local" ? "local" : "cloudinary";

    const recBase = {
      id: recId,
      user_id: (req as any).user?.id ? String((req as any).user.id) : null,
      name: cleanName,
      bucket,
      path,
      folder: folder ?? null,
      mime: part.mimetype,
      size: typeof up.bytes === "number" ? up.bytes : buf.length,
      width: typeof up.width === "number" ? up.width : null,
      height: typeof up.height === "number" ? up.height : null,
      url: up.secure_url || null,
      hash: up.etag ?? null,
      etag: up.etag ?? null,
      provider,
      provider_public_id: up.public_id ?? null,
      provider_resource_type: (up.resource_type || "image") as string,
      provider_format: up.format ?? null,
      provider_version:
        typeof up.version === "number" ? up.version : null,
      metadata: formMeta,
    };

    try {
      await repoInsert(omitNullish(recBase));
      out.push({
        ...recBase,
        url: publicUrlOf(recBase.bucket, recBase.path, recBase.url),
      });
    } catch (e) {
      const err = e as { message?: string };
      if (isDup(err)) {
        const existing = await getByBucketPath(bucket, path);
        if (existing) {
          out.push({
            ...existing,
            url: publicUrlOf(
              existing.bucket,
              existing.path,
              existing.url,
            ),
          });
          continue;
        }
      }
      out.push({
        file: cleanName,
        error: {
          where: "db_insert",
          message: err?.message ?? "db_insert_failed",
        },
      });
    }
  }

  return reply.send({ count: out.length, items: out });
};

/** GET /admin/storage/folders → string[] */
export const adminListFolders: RouteHandler = async (_req, reply) => {
  const folders = await (await import("./repository")).listFolders();
  return reply.send(folders);
};

/** GET /admin/storage/_diag/cloud */
export const adminDiagCloudinary: RouteHandler = async (_req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return reply.code(501).send({ message: "cloudinary_not_configured" });

  try {
    await (cloudinary as any).api.ping();
  } catch (e) {
    const err = e as { name?: string; message?: string; http_code?: number };
    return reply.code(502).send({
      step: "api.ping",
      error: {
        name: err?.name,
        msg: err?.message,
        http: err?.http_code,
      },
    });
  }

  const tiny = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg/4qQpwAAAAASUVORK5CYII=",
    "base64",
  );

  try {
    const up = await uploadBufferAuto(cfg, tiny, {
      folder: "diag",
      publicId: `ping_${Date.now()}`,
    });
    return reply.send({
      ok: true,
      cloud: cfg.cloudName,
      uploaded: { public_id: up.public_id, secure_url: up.secure_url },
    });
  } catch (e) {
    const err = e as { name?: string; message?: string; http_code?: number; error?: unknown; response?: unknown };
    return reply.code(502).send({
      step: "uploader.upload",
      error: {
        name: err?.name,
        msg: err?.message,
        http: err?.http_code,
        cld: err?.error || err?.response || null,
      },
    });
  }
};
