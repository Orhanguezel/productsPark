// =============================================================
// FILE: src/integrations/metahub/client/uploader/client.ts (Facade)
// =============================================================
import { store as storeU } from "@/store";
import { normalizeError as nErr } from "@/integrations/metahub/core/errors";
import { uploadsApi, type SignPutBody, type SignMultipartBody } from "@/integrations/metahub/rtk/endpoints/uploads.endpoints";

export type UploadResult = { url: string };

export type UploadOptions = {
  folder?: string;
  maxSizeMB?: number; // default 10
  allow?: string[];   // allowed MIME types
};

const CLD_CLOUD = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) || "";
const CLD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) || "";

function ensureOk(file: File, opts?: UploadOptions) {
  const max = (opts?.maxSizeMB ?? 10) * 1024 * 1024;
  if (file.size > max) throw new Error(`Dosya çok büyük: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
  if (opts?.allow && opts.allow.length && !opts.allow.includes(file.type)) {
    throw new Error(`Geçersiz MIME: ${file.type}`);
  }
}

/** Backend imzalı PUT (S3 vb.) */
async function signedPut(file: File, folder?: string): Promise<UploadResult> {
  const body: SignPutBody = { filename: file.name, content_type: file.type, folder };
  const { upload_url, public_url, headers } = await storeU
    .dispatch(uploadsApi.endpoints.signPut.initiate(body))
    .unwrap();
  const putHeaders = new Headers(headers ?? {});
  if (!putHeaders.has("content-type") && file.type) putHeaders.set("content-type", file.type);
  const res = await fetch(upload_url, { method: "PUT", headers: putHeaders, body: file });
  if (!res.ok) throw new Error(`Upload PUT failed: ${res.status}`);
  return { url: public_url };
}

/** Backend imzalı multipart POST (S3 form) */
async function multipart(file: File, folder?: string): Promise<UploadResult> {
  const body: SignMultipartBody = { filename: file.name, content_type: file.type, folder };
  const { upload_url, public_url, fields } = await storeU
    .dispatch(uploadsApi.endpoints.signMultipart.initiate(body))
    .unwrap();
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  fd.append("file", file);
  const res = await fetch(upload_url, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload POST failed: ${res.status}`);
  return { url: public_url };
}

/** Cloudinary unsigned upload (preset ile) */
async function cloudinaryUnsigned(file: File, folder?: string): Promise<UploadResult> {
  if (!CLD_CLOUD || !CLD_PRESET) throw new Error("cloudinary_not_configured");
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLD_CLOUD)}/auto/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLD_PRESET);
  if (folder) fd.append("folder", folder);

  const res = await fetch(endpoint, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const json = (await res.json()) as { secure_url?: unknown; url?: unknown };
  const url = String(json.secure_url ?? json.url ?? "");
  if (!url) throw new Error("cloudinary_no_url");
  return { url };
}

export const uploader = {
  async uploadImageSmart(
    file: File,
    opts?: UploadOptions
  ): Promise<{ data: UploadResult | null; error: { message: string } | null }> {
    try {
      ensureOk(file, { ...opts, allow: opts?.allow ?? ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"] });

      // 1) Cloudinary tercihi (env varsa)
      if (CLD_CLOUD && CLD_PRESET) {
        try {
          const cld = await cloudinaryUnsigned(file, opts?.folder);
          return { data: cld, error: null };
        } catch {
          // Cloudinary başarısız → imzalı akışlara düş
        }
      }

      // 2) İmzalı PUT dene → sonra multipart'a düş
      try {
        const put = await signedPut(file, opts?.folder);
        return { data: put, error: null };
      } catch {
        const mp = await multipart(file, opts?.folder);
        return { data: mp, error: null };
      }
    } catch (e) {
      const { message } = nErr(e);
      return { data: null, error: { message } };
    }
  },

  // low-level exports if needed
  _signedPut: signedPut,
  _multipart: multipart,
  _cloudinaryUnsigned: cloudinaryUnsigned,
};
