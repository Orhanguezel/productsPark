const API_URL =
  ((import.meta.env.VITE_STORAGE_URL as string | undefined) ||
   (import.meta.env.VITE_API_URL as string | undefined) + "/storage" ||
   "").replace(/\/+$/, "");

type UploadOptions = { upsert?: boolean };

function bucket(bucket: string) {
  return {
    async upload(path: string, file: File | Blob, opts?: UploadOptions): Promise<{ data: { path: string } | null; error: { message: string } | null }> {
      if (!API_URL) return { data: null, error: { message: "storage_disabled_no_backend" } };
      const qs = new URLSearchParams();
      if (opts?.upsert) qs.set("upsert", "1");
      const url = `${API_URL}/${encodeURIComponent(bucket)}/upload?path=${encodeURIComponent(path)}&${qs.toString()}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { /* 'content-type' otomatik form-data oluyor */ },
        body: (() => {
          const f = new FormData();
          f.append("file", file);
          return f;
        })(),
      });
      if (!res.ok) return { data: null, error: { message: `upload_failed_${res.status}` } };
      const json = await res.json().catch(() => null);
      return { data: json ?? { path }, error: null };
    },

    getPublicUrl(path: string): { data: { publicUrl: string } } {
      // Basit kural: GET /storage/<bucket>/public/<path> üzerinden servis verin (BE bu route’u sağlasın)
      const publicUrl = `${API_URL}/${encodeURIComponent(bucket)}/public/${encodeURIComponent(path)}`;
      return { data: { publicUrl } };
    },
  };
}

export const storage = { from: bucket };

/** Eski kullanım stilini kolaylaştırmak için alias */
export const metahubstorage = storage;
