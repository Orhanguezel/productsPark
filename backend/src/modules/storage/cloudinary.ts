import { v2 as cloudinary } from "cloudinary";
import { env } from "@/core/env";

type Cfg = {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  defaultFolder?: string;
};

export function getCloudinaryConfig(): Cfg | null {
  const cloudName    = env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY?.cloudName;
  const apiKey       = env.CLOUDINARY_API_KEY    || env.CLOUDINARY?.apiKey;
  const apiSecret    = env.CLOUDINARY_API_SECRET || env.CLOUDINARY?.apiSecret;
  const uploadPreset = env.CLOUDINARY_UPLOAD_PRESET || undefined;
  // düz env için default klasör desteği
  const defaultFolder = env.CLOUDINARY?.folder || undefined;

  if (!cloudName) return null;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret, uploadPreset, defaultFolder };
}

type UpOpts = { folder?: string; publicId?: string; mime?: string };

/** Cloudinary public URL (folder + publicId) */
export function buildCloudinaryUrl(cloud: string, publicId: string, folder?: string) {
  const pid = (folder ? `${folder}/` : "") + publicId.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${cloud}/image/upload/${pid}`;
}

export async function uploadBufferUnsigned(cfg: Cfg, buffer: Buffer, opts: UpOpts) {
  if (!cfg.uploadPreset) {
    throw Object.assign(new Error("CLOUDINARY_UPLOAD_PRESET missing for unsigned upload"), {
      code: "NO_UNSIGNED_PRESET",
    });
  }
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        upload_preset: cfg.uploadPreset,
        folder: opts.folder ?? cfg.defaultFolder,
        public_id: opts.publicId, // sadece basename
        resource_type: "auto",
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
}

export async function uploadBufferSigned(cfg: Cfg, buffer: Buffer, opts: UpOpts) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder ?? cfg.defaultFolder,
        public_id: opts.publicId, // sadece basename
        resource_type: "auto",
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });
}

/** preferSigned=true → varsa key/secret ile imzalı upload (preset’e bağımlı değil) */
export async function uploadBufferAuto(
  cfg: Cfg,
  buffer: Buffer,
  opts: UpOpts,
  preferSigned = false
) {
  if (preferSigned && cfg.apiKey && cfg.apiSecret) return uploadBufferSigned(cfg, buffer, opts);
  if (cfg.uploadPreset) return uploadBufferUnsigned(cfg, buffer, opts);
  if (cfg.apiKey && cfg.apiSecret) return uploadBufferSigned(cfg, buffer, opts);
  throw Object.assign(new Error("Cloudinary not configured (no unsigned preset or api credentials)"), {
    code: "CLOUDINARY_NOT_CONFIGURED",
  });
}

export async function destroyPublicId(publicId: string) {
  try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); } catch {}
  try { await cloudinary.uploader.destroy(publicId, { resource_type: "raw"   }); } catch {}
}
