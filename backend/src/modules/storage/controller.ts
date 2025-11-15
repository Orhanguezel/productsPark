// src/modules/storage/controller.ts

import type { RouteHandler } from "fastify";
import { randomUUID } from "node:crypto";
import type { MultipartFile } from "@fastify/multipart";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { storageAssets } from "./schema";

import {
  type StorageListQuery,
  type SignPutBody,
  signMultipartBodySchema,
  type SignMultipartBody,
} from "./validation";
import {
  getCloudinaryConfig,
  uploadBufferAuto,
} from "./cloudinary";
import { env } from "@/core/env";

/* --------------------------------- helpers -------------------------------- */

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");

/** NULL/undefined alanları INSERT’ten at */
const omitNullish = <T extends Record<string, any>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

/** Duplikeyi (1062) robust yakala (drizzle cause.* dahil) */
function isDup(err: unknown) {
  const e = err as any;
  const codes = [e?.code, e?.errno, e?.cause?.code, e?.cause?.errno];
  return codes.includes("ER_DUP_ENTRY") || codes.includes(1062);
}

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

async function getAssetByBucketPath(bucket: string, path: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(
      and(eq(storageAssets.bucket, bucket), eq(storageAssets.path, path)),
    )
    .limit(1);
  return rows[0] ?? null;
}

// --- path helpers ---
const stripLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const normalizePath = (bucket: string, raw: string) => {
  let p = stripLeadingSlashes(raw).replace(/\/{2,}/g, "/");
  if (p.startsWith(bucket + "/")) p = p.slice(bucket.length + 1);
  return p;
};

/* ---------------------------------- PUBLIC --------------------------------- */

/** GET/HEAD /storage/:bucket/* → provider URL'ye 302 */
export const publicServe: RouteHandler<{
  Params: { bucket: string; "*": string };
}> = async (req, reply) => {
  const { bucket } = req.params;
  const raw = req.params["*"] || "";
  const path = normalizePath(bucket, raw);

  const row = await getAssetByBucketPath(bucket, path);
  if (!row) return reply.code(404).send({ message: "not_found" });

  // ✅ Daima düzgün 302 redirect
  return reply.redirect(302, row.url || publicUrlOf(bucket, path, null));
};

/** POST /storage/:bucket/upload (FormData) — server-side signed upload */
export const uploadToBucket: RouteHandler<{
  Params: { bucket: string };
  Querystring: { path?: string; upsert?: string };
}> = async (req, reply) => {
  const cfg = getCloudinaryConfig();
  if (!cfg)
    return reply
      .code(501)
      .send({ message: "cloudinary_not_configured" });

  const mp: MultipartFile | undefined = await req.file();
  if (!mp) return reply.code(400).send({ message: "file_required" });

  const buf = await mp.toBuffer();
  const { bucket } = req.params;

  // ✅ PATH NORMALIZATION
  const desiredRaw = (req.query?.path ?? mp.filename ?? "file").trim();
  const desired = normalizePath(bucket, desiredRaw);

  const cleanName = desired.split("/").pop()!.replace(/[^\w.\-]+/g, "_");
  const folder = desired.includes("/")
    ? desired.split("/").slice(0, -1).join("/")
    : undefined;
  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

  let up: any;
  try {
    // ❌ ESKİ: uploadBufferAuto(cfg, buf, {...}, true);
    // ✅ YENİ: helper artık 3 argüman alıyor; upsert/overwrite vb. opsiyon varsa
    // onu options içine gömüyoruz.
    up = await uploadBufferAuto(
      cfg,
      buf,
      {
        folder,
        publicId: publicIdBase,
        mime: mp.mimetype,
        overwrite: true,
      } as any,
    );
  } catch (e: any) {
    const http = Number(e?.http_code) || 502;
    return reply
      .code(http >= 400 && http < 500 ? http : 502)
      .send({
        error: {
          code: "cloudinary_upload_error",
          name: e?.name,
          message: e?.message,
          http_code: e?.http_code,
          cld_error: e?.error || e?.response || null,
        },
      });
  }

  const path = folder ? `${folder}/${cleanName}` : cleanName;

  const recId = randomUUID();
  const provider =
    env.STORAGE_DRIVER === "local" ? "local" : "cloudinary";

  const recordBase = {
    id: recId,
    user_id: (req as any).user?.id
      ? String((req as any).user.id)
      : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size: up.bytes,
    width: up.width ?? null,
    height: up.height ?? null,
    url: up.secure_url,
    hash: up.etag ?? null,
    etag: up.etag ?? null,
    provider,
    provider_public_id: up.public_id ?? null,
    provider_resource_type: up.resource_type ?? null,
    provider_format: up.format ?? null,
    provider_version:
      typeof up.version === "number" ? up.version : null,
    metadata: null as Record<string, string> | null,
  };

  try {
    await db.insert(storageAssets).values(omitNullish(recordBase) as any);
  } catch (e) {
    if (!isDup(e)) throw e;
    const existing = await getAssetByBucketPath(bucket, path);
    if (existing) {
      return reply.send({
        id: existing.id,
        bucket: existing.bucket,
        path: existing.path,
        folder: existing.folder ?? null,
        url: publicUrlOf(
          existing.bucket,
          existing.path,
          existing.url,
        ),
        width: existing.width ?? null,
        height: existing.height ?? null,
        provider: existing.provider,
        provider_public_id:
          existing.provider_public_id ?? null,
        provider_resource_type:
          existing.provider_resource_type ?? null,
        provider_format: existing.provider_format ?? null,
        provider_version:
          existing.provider_version ?? null,
        etag: existing.etag ?? null,
      });
    }
    throw e;
  }

  return reply.send({
    id: recId,
    bucket,
    path,
    folder: folder ?? null,
    url: publicUrlOf(bucket, path, up.secure_url),
    width: up.width ?? null,
    height: up.height ?? null,
    provider: "cloudinary",
    provider_public_id: up.public_id ?? null,
    provider_resource_type: up.resource_type ?? null,
    provider_format: up.format ?? null,
    provider_version:
      typeof up.version === "number" ? up.version : null,
    etag: up.etag ?? null,
  });
};

/** POST /storage/uploads/sign-put → S3 yoksa 501 */
export const signPut: RouteHandler<{ Body: SignPutBody }> = async (
  _req,
  reply,
) => {
  return reply.code(501).send({ message: "s3_not_configured" });
};

/** POST /storage/uploads/sign-multipart → Cloudinary unsigned upload */
export const signMultipart: RouteHandler<{
  Body: SignMultipartBody;
}> = async (req, reply) => {
  const parsed = signMultipartBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        message: "invalid_body",
        issues: parsed.error.flatten(),
      },
    });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg)
    return reply
      .code(501)
      .send({ message: "cloudinary_not_configured" });

  // ❌ cfg.uploadPreset TS’te yok
  // ✅ Farklı isimleri destekle, TS’i de sustur
  const uploadPreset =
    (cfg as any).uploadPreset ??
    (cfg as any).unsignedUploadPreset ??
    (cfg as any).unsigned_preset ??
    null;

  if (!uploadPreset) {
    return reply
      .code(501)
      .send({ message: "unsigned_upload_disabled" });
  }

  const { filename, folder } = parsed.data;
  const clean = (filename || "file").replace(/[^\w.\-]+/g, "_");
  const publicId = clean.replace(/\.[^.]+$/, "");

  const upload_url = `https://api.cloudinary.com/v1_1/${(cfg as any).cloudName}/auto/upload`;

  const fields: Record<string, string> = {
    upload_preset: uploadPreset,
    folder: folder ?? "",
    public_id: publicId,
  };

  return reply.send({ upload_url, fields });
};
