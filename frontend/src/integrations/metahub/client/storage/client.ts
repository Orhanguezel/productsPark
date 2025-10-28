// =============================================================
// FILE: src/integrations/metahub/client/storage/client.ts
// =============================================================
const RAW_STORAGE =
  (import.meta.env.VITE_STORAGE_URL as string | undefined) ||
  ((((import.meta.env.VITE_API_URL as string | undefined) || "").replace(/\/+$/, "")) + "/storage");

const API_URL = (RAW_STORAGE || "").replace(/\/+$/, "");
const CDN_URL = (import.meta.env.VITE_CDN_URL as string | undefined)?.replace(/\/+$/, "");

export type UploadOptions = { upsert?: boolean };
export type UploadResp = { path: string; url: string };
export type Err = { message: string };

/** "folder/sub/img.png" → "folder/sub/img.png" (segment bazlı encode) */
function encPath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

/** Public route KULLANMADAN URL üret */
function urlOf(bucket: string, path: string): string {
  const b = encodeURIComponent(bucket);
  const p = encPath(path);
  // CDN varsa doğrudan CDN → bucket/path
  if (CDN_URL) return `${CDN_URL}/${b}/${p}`;
  // Aksi halde backend storage serve → /storage/:bucket/:path  (NOT: /public yok!)
  return `${API_URL}/${b}/${p}`;
}

function from(bucket: string) {
  return {
    async upload(
      path: string,
      file: File | Blob,
      opts?: UploadOptions
    ): Promise<{ data: UploadResp | null; error: Err | null }> {
      if (!API_URL) return { data: null, error: { message: "storage_disabled_no_backend" } };

      const qs = new URLSearchParams();
      qs.set("path", path);
      if (opts?.upsert) qs.set("upsert", "1");

      const url = `${API_URL}/${encodeURIComponent(bucket)}/upload?${qs.toString()}`;

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(url, { method: "POST", credentials: "include", body: fd });
      if (!res.ok) return { data: null, error: { message: `upload_failed_${res.status}` } };

      // BE {path,url}? dönebilir; dönmezse URL’i biz türetiriz
      const json = (await res.json().catch(() => null)) as Partial<UploadResp> | null;
      const p = json?.path || path;
      const u = json?.url || urlOf(bucket, p);
      return { data: { path: p, url: u }, error: null };
    },

    // UI imzasını BOZMAMAK için isim aynı kalsın; "public" rota kullanılmıyor.
    getPublicUrl(path: string): { data: { publicUrl: string } } {
      return { data: { publicUrl: urlOf(bucket, path) } };
    },

    // İleride gerekirse:
    // async remove(path: string) { ... }
    // async list(prefix?: string) { ... }
  };
}

export const storage = { from };
