import type { RouteHandler } from "fastify";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, like, sql as dsql } from "drizzle-orm";
import { db } from "@/db/client";
import { storageAssets } from "./schema";
import {
  storageListQuerySchema,
  type StorageListQuery,
  storageUpdateSchema,
  type StorageUpdateInput,
  type SignPutBody,
  signMultipartBodySchema,
  type SignMultipartBody,
} from "./validation";
import { getCloudinaryConfig, uploadBufferAuto, destroyPublicId, buildCloudinaryUrl } from "./cloudinary";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import { env } from "@/core/env";

/* --------------------------------- helpers -------------------------------- */

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");

/** NULL/undefined alanları INSERT’ten at */
const omitNullish = <T extends Record<string, any>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;

/** Duplikeyi (1062) robust yakala (drizzle cause.* dahil) */
function isDup(err: unknown) {
  const e = err as any;
  const codes = [e?.code, e?.errno, e?.cause?.code, e?.cause?.errno];
  return codes.includes("ER_DUP_ENTRY") || codes.includes(1062);
}

function publicUrlOf(bucket: string, path: string, providerUrl?: string | null): string {
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

const ORDER = {
  created_at: storageAssets.created_at,
  name: storageAssets.name,
  size: storageAssets.size,
} as const;

function parseOrder(q: StorageListQuery) {
  const sort = q.sort ?? "created_at";
  const order = q.order ?? "desc";
  const col = ORDER[sort] ?? storageAssets.created_at;
  const primary = order === "asc" ? asc(col) : desc(col);
  return { primary };
}

async function getAssetById(id: string) {
  const rows = await db.select().from(storageAssets).where(eq(storageAssets.id, id)).limit(1);
  return rows[0] ?? null;
}

async function getAssetByBucketPath(bucket: string, path: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(and(eq(storageAssets.bucket, bucket), eq(storageAssets.path, path)))
    .limit(1);
  return rows[0] ?? null;
}

/* ---------------------------------- PUBLIC --------------------------------- */

/** GET /storage/:bucket/* → provider URL'ye 302 */
export const publicServe: RouteHandler<{ Params: { bucket: string; "*": string } }> = async (req, reply) => {
  const { bucket } = req.params;
  const path = req.params["*"];
  const row = await getAssetByBucketPath(bucket, path);
  if (row?.url) return reply.redirect(302, row.url);
  return reply.code(404).send({ message: "not_found" });
};

/** POST /storage/:bucket/upload (FormData) */
export const uploadToBucket: RouteHandler<{
  Params: { bucket: string };
  Querystring: { path?: string; upsert?: string };
}> = async (req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg) return reply.code(501).send({ message: "cloudinary_not_configured" });

  const mp: MultipartFile | undefined = await req.file();
  if (!mp) return reply.code(400).send({ message: "file_required" });

  const buf = await mp.toBuffer();
  const { bucket } = req.params;

  const desired = (req.query?.path ?? mp.filename ?? "file").trim();
  const cleanName = desired.split("/").pop()!.replace(/[^\w.\-]+/g, "_");
  const folder = desired.includes("/") ? desired.split("/").slice(0, -1).join("/") : undefined;

  // public_id sadece basename (ext’siz); klasör ayrı param
  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

  let up: any;
  try {
    // server-side signed tercih → preset bağımlılığı yok
    up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: mp.mimetype }, true);
  } catch (e: any) {
    const http = Number(e?.http_code) || 502;
    const msg = e?.message || "upload_failed";
    return reply.code(http >= 400 && http < 500 ? http : 502).send({
      error: { code: "cloudinary_upload_error", message: msg },
    });
  }

  const path = folder ? `${folder}/${cleanName}` : cleanName;
  const recordBase = {
    id: randomUUID(),
    user_id: (req as any).user?.id ? String((req as any).user.id) : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size: up.bytes,
    width: up.width ?? null,
    height: up.height ?? null,
    url: up.secure_url,
    hash: null,
    metadata: null as Record<string, string> | null,
  };
  const record = omitNullish(recordBase);

  try {
    await db.insert(storageAssets).values(record as any);
  } catch (e) {
    if (!isDup(e)) throw e;
    const existing = await getAssetByBucketPath(bucket, path);
    if (existing) {
      return reply.send({ path: existing.path, url: publicUrlOf(existing.bucket, existing.path, existing.url) });
    }
    throw e;
  }

  return reply.send({ path, url: publicUrlOf(bucket, path, up.secure_url) });
};

/** POST /storage/uploads/sign-put → S3 yoksa 501 */
export const signPut: RouteHandler<{ Body: SignPutBody }> = async (_req, reply) => {
  return reply.code(501).send({ message: "s3_not_configured" });
};

/** POST /storage/uploads/sign-multipart → Cloudinary unsigned */
export const signMultipart: RouteHandler<{ Body: SignMultipartBody }> = async (req, reply) => {
  const parsed = signMultipartBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg) return reply.code(501).send({ message: "cloudinary_not_configured" });
  if (!cfg.uploadPreset) return reply.code(501).send({ message: "unsigned_upload_disabled" });

  const { filename, folder } = parsed.data;
  const clean = (filename || "file").replace(/[^\w.\-]+/g, "_");
  const publicId = clean.replace(/\.[^.]+$/, ""); // sadece basename

  const upload_url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
  const public_url = buildCloudinaryUrl(cfg.cloudName, publicId, folder);
  const fields: Record<string, string> = {
    upload_preset: cfg.uploadPreset!,
    folder: folder ?? "",
    public_id: publicId,
  };
  return reply.send({ upload_url, public_url, fields });
};

/* ---------------------------------- ADMIN ---------------------------------- */

export const adminListAssets: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = storageListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }
  const q = parsed.data;

  const where =
    and(
      q.bucket ? eq(storageAssets.bucket, q.bucket) : dsql`1=1`,
      q.folder != null ? eq(storageAssets.folder, q.folder) : dsql`1=1`,
      q.mime ? like(storageAssets.mime, `${q.mime}%`) : dsql`1=1`,
      q.q ? like(storageAssets.name, `%${q.q}%`) : dsql`1=1`,
    );

  const [{ total }] = await db.select({ total: dsql<number>`COUNT(*)` }).from(storageAssets).where(where);

  const { primary } = parseOrder(q);
  const rows = await db
    .select()
    .from(storageAssets)
    .where(where)
    .orderBy(primary)
    .limit(q.limit)
    .offset(q.offset);

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows);
};

export const adminGetAsset: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getAssetById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const adminCreateAsset: RouteHandler = async (req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg) return reply.code(501).send({ message: "cloudinary_not_configured" });

  const mp: MultipartFile | undefined = await (req as any).file();
  if (!mp) return reply.code(400).send({ message: "file_required" });
  const buf = await mp.toBuffer();

  const fields = mp.fields as Record<string, MultipartValue>;
  const s = (k: string): string | undefined => (fields[k] ? String(fields[k].value) : undefined);

  const bucket = s("bucket") ?? "default";
  const folder = s("folder") ?? undefined;

  let metadata: Record<string, string> | null = null;
  const metaRaw = s("metadata");
  if (metaRaw) {
    try { metadata = JSON.parse(metaRaw) as Record<string, string>; } catch { metadata = null; }
  }

  const cleanName = (mp.filename || "file").replace(/[^\w.\-]+/g, "_");
  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");
  const up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: mp.mimetype }, true);

  const path = folder ? `${folder}/${cleanName}` : cleanName;
  const recBase = {
    id: randomUUID(),
    user_id: (req as any).user?.id ? String((req as any).user.id) : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size: up.bytes,
    width: up.width ?? null,
    height: up.height ?? null,
    url: up.secure_url,
    hash: null,
    metadata, // object veya null
  };
  const rec = omitNullish(recBase);

  try {
    await db.insert(storageAssets).values(rec as any);
  } catch (e) {
    if (isDup(e)) {
      const existing = await getAssetByBucketPath(bucket, path);
      if (existing) {
        return reply.code(200).send({
          ...existing,
          url: publicUrlOf(existing.bucket, existing.path, existing.url),
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        });
      }
    }
    throw e;
  }

  return reply.code(201).send({
    ...recBase,
    url: publicUrlOf(recBase.bucket, recBase.path, recBase.url),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

export const adminPatchAsset: RouteHandler<{ Params: { id: string }; Body: StorageUpdateInput }> = async (req, reply) => {
  const parsed = storageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }

  const patch = parsed.data;
  const sets: Record<string, unknown> = { updated_at: dsql`CURRENT_TIMESTAMP(3)` };

  if (patch.name !== undefined) sets.name = patch.name;
  if (patch.folder !== undefined) {
    sets.folder = patch.folder;
    const cur = await getAssetById(req.params.id);
    if (cur) {
      const baseName = cur.path.split("/").pop()!;
      sets.path = patch.folder ? `${patch.folder}/${baseName}` : baseName;
    }
  }
  if (patch.metadata !== undefined) sets.metadata = patch.metadata;

  await db.update(storageAssets).set(sets).where(eq(storageAssets.id, req.params.id));
  const fresh = await getAssetById(req.params.id);
  if (!fresh) return reply.code(404).send({ error: { message: "not_found" } });

  return reply.send(fresh);
};

export const adminDeleteAsset: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getAssetById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  try {
    const publicIdPath = row.path.replace(/\.[^.]+$/, ""); // folder/name (ext’siz)
    await destroyPublicId(publicIdPath);
  } catch {}
  await db.delete(storageAssets).where(eq(storageAssets.id, req.params.id));
  return reply.code(204).send();
};

export const adminBulkDelete: RouteHandler<{ Body: { ids: string[] } }> = async (req, reply) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  let deleted = 0;
  for (const id of ids) {
    const row = await getAssetById(id);
    if (!row) continue;
    try {
      const publicIdPath = row.path.replace(/\.[^.]+$/, "");
      await destroyPublicId(publicIdPath);
    } catch {}
    await db.delete(storageAssets).where(eq(storageAssets.id, id));
    deleted++;
  }
  return reply.send({ deleted });
};

export const adminListFolders: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select({ folder: storageAssets.folder })
    .from(storageAssets)
    .where(dsql`${storageAssets.folder} IS NOT NULL`)
    .groupBy(storageAssets.folder);

  const folders = rows.map(r => r.folder as string).filter(Boolean);
  return reply.send(folders);
};
