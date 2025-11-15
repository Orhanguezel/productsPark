// =============================================================
// FILE: src/modules/storage/cloudinary.ts
// Amaç: STORAGE_DRIVER=cloudinary | local
//  - cloudinary: signed upload (api_key + api_secret ile)
//  - local: buffer'ı sunucu diskine yazar, URL'i kendi domaininden üretir
// =============================================================
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/core/env";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const STORAGE_DRIVER = env.STORAGE_DRIVER === "local" ? "local" : "cloudinary";

export type Cfg = {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  defaultFolder?: string;
};

export type UploadResult = {
  public_id: string;
  secure_url: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  resource_type?: string | null;
  version?: number | null;
  etag?: string | null;
};

export type RenameResult = {
  public_id: string;
  secure_url?: string;
  version?: number;
  format?: string;
};

/* -------------------------------------------------------------------------- */
/*                               CONFIG OKUMA                                 */
/* -------------------------------------------------------------------------- */

export function getCloudinaryConfig(): Cfg | null {
  const defaultFolder =
    env.CLOUDINARY_FOLDER || env.CLOUDINARY?.folder || undefined;

  // LOCAL mod: Cloudinary yok, ama defaultFolder lazım olabilir
  if (STORAGE_DRIVER === "local") {
    return {
      cloudName: "local",
      apiKey: undefined,
      apiSecret: undefined,
      defaultFolder,
    };
  }

  const cloudName =
    env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY?.cloudName || "";
  const apiKey =
    env.CLOUDINARY_API_KEY || env.CLOUDINARY?.apiKey || "";
  const apiSecret =
    env.CLOUDINARY_API_SECRET || env.CLOUDINARY?.apiSecret || "";

  // 🔴 Her üçü de yoksa Cloudinary çalıştırmıyoruz
  if (!cloudName || !apiKey || !apiSecret) return null;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret, defaultFolder };
}

/* -------------------------------------------------------------------------- */
/*                              LOCAL YÜKLEME                                  */
/* -------------------------------------------------------------------------- */

type UpOpts = { folder?: string; publicId?: string; mime?: string };

function guessExt(mime?: string): string {
  if (!mime) return "";
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  return "";
}

async function uploadLocal(cfg: Cfg, buffer: Buffer, opts: UpOpts): Promise<UploadResult> {
  const root =
    env.LOCAL_STORAGE_ROOT ||
    path.join(process.cwd(), "uploads");

  const folder =
    (opts.folder ?? cfg.defaultFolder ?? "").replace(/^\/+|\/+$/g, "");

  const ext = guessExt(opts.mime);
  let baseName =
    (opts.publicId && opts.publicId.replace(/^\/+/, "")) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (ext && !baseName.includes(".")) {
    baseName += ext;
  }

  const relativePath = folder ? `${folder}/${baseName}` : baseName;
  const absDir = path.join(root, folder || ".");
  const absFile = path.join(root, relativePath);

  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(absFile, buffer);

  const baseUrl =
    (env.LOCAL_STORAGE_BASE_URL || "/uploads").replace(/\/+$/, "");
  const url = `${baseUrl}/${relativePath}`.replace(/\/{2,}/g, "/");

  return {
    public_id: relativePath.replace(/\.[^.]+$/, ""),
    secure_url: url,
    bytes: buffer.length,
    width: null,
    height: null,
    format: ext ? ext.replace(".", "") : null,
    resource_type: "image",
    version: null,
    etag: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                         CLOUDINARY (SIGNED) UPLOAD                          */
/* -------------------------------------------------------------------------- */

export async function uploadBufferAuto(
  cfg: Cfg,
  buffer: Buffer,
  opts: UpOpts,
): Promise<UploadResult> {
  // LOCAL driver → diske yaz
  if (STORAGE_DRIVER === "local") {
    return uploadLocal(cfg, buffer, opts);
  }

  // Cloudinary driver: her zaman signed upload_stream kullan
  const folder = opts.folder ?? cfg.defaultFolder;

  const rawResult = await new Promise<unknown>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: opts.publicId,
        resource_type: "auto",
        overwrite: true,
      },
      (err, res) => {
        if (err || !res) {
          return reject(err ?? new Error("upload_failed"));
        }
        resolve(res);
      },
    );
    stream.end(buffer);
  });

  // minimum alanları çek
  const r = rawResult as {
    public_id?: string;
    secure_url?: string;
    bytes?: number;
    width?: number;
    height?: number;
    format?: string;
    resource_type?: string;
    version?: number;
    etag?: string;
  };

  if (!r.public_id || !r.secure_url) {
    throw new Error("cloudinary_invalid_response");
  }

  return {
    public_id: r.public_id,
    secure_url: r.secure_url,
    bytes: typeof r.bytes === "number" ? r.bytes : buffer.length,
    width: typeof r.width === "number" ? r.width : null,
    height: typeof r.height === "number" ? r.height : null,
    format: r.format ?? null,
    resource_type: r.resource_type ?? null,
    version: typeof r.version === "number" ? r.version : null,
    etag: r.etag ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*                       SİLME / YENİDEN ADLANDIRMA                           */
/* -------------------------------------------------------------------------- */

export async function destroyCloudinaryById(
  publicId: string,
  resourceType?: string,
): Promise<void> {
  if (STORAGE_DRIVER === "local") {
    const root =
      env.LOCAL_STORAGE_ROOT ||
      path.join(process.cwd(), "uploads");
    const rel = publicId.replace(/^\/+/, "");
    const abs = path.join(root, rel);
    try {
      await fs.unlink(abs);
    } catch {
      // dosya yoksa sessiz geç
    }
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType ?? "image",
    invalidate: true,
  });
}

export async function renameCloudinaryPublicId(
  oldPublicId: string,
  newPublicId: string,
  resourceType: string = "image",
): Promise<RenameResult> {
  if (STORAGE_DRIVER === "local") {
    const root =
      env.LOCAL_STORAGE_ROOT ||
      path.join(process.cwd(), "uploads");
    const oldRel = oldPublicId.replace(/^\/+/, "");
    const newRel = newPublicId.replace(/^\/+/, "");
    const oldAbs = path.join(root, oldRel);
    const newAbs = path.join(root, newRel);

    await fs.mkdir(path.dirname(newAbs), { recursive: true });
    try {
      await fs.rename(oldAbs, newAbs);
    } catch {
      // yoksa sessiz geç
    }

    const baseUrl =
      (env.LOCAL_STORAGE_BASE_URL || "/uploads").replace(/\/+$/, "");
    return {
      public_id: newRel,
      secure_url: `${baseUrl}/${newRel}`,
    };
  }

  const raw = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
    resource_type: resourceType,
    overwrite: true,
  });

  const r = raw as {
    public_id?: string;
    secure_url?: string;
    version?: number;
    format?: string;
  };

  return {
    public_id: r.public_id ?? newPublicId,
    secure_url: r.secure_url,
    version: r.version,
    format: r.format,
  };
}
