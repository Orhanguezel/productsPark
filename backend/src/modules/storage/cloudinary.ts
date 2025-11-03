import { v2 as cloudinary } from "cloudinary";
import { env } from "@/core/env";

export type Cfg = {
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
  const defaultFolder = env.CLOUDINARY?.folder || undefined;

  if (!cloudName) return null;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret, uploadPreset, defaultFolder };
}

type UpOpts = { folder?: string; publicId?: string; mime?: string };

/** Opsiyonel — kullanmıyoruz; elde gerçek secure_url var */
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

/** Güvenli destroy — resource_type verilirse tek atış; verilmezse image/video/raw dener */
export async function destroyCloudinaryById(publicId: string, resourceType?: string) {
  const tryTypes = resourceType ? [resourceType] : ["image", "video", "raw"];
  for (const rt of tryTypes) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: rt as any, invalidate: true });
      return;
    } catch (_) {}
  }
}

/** Klasör değişiminde uzak rename (overwrite=true) */
export async function renameCloudinaryPublicId(
  oldPublicId: string,
  newPublicId: string,
  resourceType: string = "image"
) {
  return cloudinary.uploader.rename(oldPublicId, newPublicId, {
    resource_type: resourceType as any,
    overwrite: true,
  });
}
