// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  StorageMeta,
  StorageAsset,
  ApiStorageAsset,
  StorageListParams,
} from "../../../db/types/storage";

// ---------- utils (type-safe) ----------
const toIso = (x: unknown): string => {
  if (x instanceof Date) return x.toISOString();
  if (typeof x === "number" || typeof x === "string") {
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
};
const toNum = (x: unknown): number => {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof x === "bigint") return Number(x);
  const n = Number((x as unknown) ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

const normalize = (a: ApiStorageAsset): StorageAsset => ({
  ...a,
  size: toNum(a.size),
  width: a.width == null ? null : toNum(a.width),
  height: a.height == null ? null : toNum(a.height),
  metadata: a.metadata == null ? null : tryParse<StorageMeta>(a.metadata),
  created_at: toIso(a.created_at),
  updated_at: toIso(a.updated_at),
});

const toParams = (p: StorageListParams) => ({
  q: p.q,
  bucket: p.bucket,
  folder: p.folder ?? undefined,
  mime: p.mime,
  limit: p.limit,
  offset: p.offset,
  sort: p.sort,
  order: p.order,
});

const cleanParams = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)) as Record<string, string | number>;

// ---------- Blob guard ----------
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta || "")?.[1] || "application/octet-stream";
  const bin = atob(data || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

type HasFiles = { files?: FileList | null };
type EventLike = { target?: HasFiles; currentTarget?: HasFiles };

function pickFromEvent(x: unknown): File | Blob | null {
  const ev = x as EventLike;
  const fl = ev?.target?.files ?? ev?.currentTarget?.files;
  if (fl && fl.length > 0) return fl[0]!;
  return null;
}

function ensureBlob(f: unknown): { blob: Blob; filename: string } {
  // 0) ChangeEvent desteği
  const evFile = pickFromEvent(f);
  if (evFile instanceof File) return { blob: evFile, filename: evFile.name || "upload.bin" };
  if (evFile instanceof Blob) return { blob: evFile, filename: "upload.bin" };

  // 1) File
  if (f instanceof File) return { blob: f, filename: f.name || "upload.bin" };
  // 2) Blob
  if (f instanceof Blob) return { blob: f, filename: "upload.bin" };
  // 3) FileList
  if (typeof FileList !== "undefined" && f instanceof FileList && f.length > 0) {
    const first = f[0]!;
    return { blob: first, filename: (first as File).name || "upload.bin" };
  }
  // 4) Array-like (File[] | Blob[])
  if (Array.isArray(f) && f.length > 0) {
    const first = f[0]!;
    if (first instanceof File) return { blob: first, filename: first.name || "upload.bin" };
    if (first instanceof Blob) return { blob: first, filename: "upload.bin" };
  }
  // 5) { file: File | Blob }
  if (typeof f === "object" && f !== null) {
    const obj = f as { file?: File | Blob };
    if (obj.file instanceof File) return { blob: obj.file, filename: obj.file.name || "upload.bin" };
    if (obj.file instanceof Blob) return { blob: obj.file, filename: "upload.bin" };
  }
  // 6) dataURL
  if (typeof f === "string" && f.startsWith("data:")) {
    const b = dataUrlToBlob(f);
    return { blob: b, filename: "upload.bin" };
  }

  // http(s) URL async ister → FE tarafında normalizeToFile hallediliyor.
  throw new Error("file_required");
}

// ---------- endpoints ----------
const BASE = "/admin/storage";

export const storageAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listStorageAssetsAdmin: b.query<StorageAsset[], StorageListParams | void>({
      query: (params) => {
        const fa: FetchArgs = { url: `${BASE}/assets` };
        if (params) fa.params = cleanParams(toParams(params));
        return fa;
      },
      transformResponse: (res: unknown): StorageAsset[] => {
        if (Array.isArray(res)) return (res as ApiStorageAsset[]).map(normalize);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiStorageAsset[]).map(normalize) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "StorageAsset" as const, id: a.id })),
              { type: "StorageAssets" as const, id: "LIST" },
            ]
          : [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    getStorageAssetAdmin: b.query<StorageAsset, string>({
      query: (id) => ({ url: `${BASE}/assets/${id}` } as FetchArgs),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      providesTags: (_r, _e, id) => [{ type: "StorageAsset", id }],
    }),

    uploadStorageAssetAdmin: b.mutation<
      StorageAsset,
      {
        file: File | Blob | string | FileList | { file?: File | Blob } | EventLike;
        bucket?: string;
        folder?: string | null;
        metadata?: StorageMeta;
      }
    >({
      query: ({ file, bucket, folder, metadata }) => {
        const form = new FormData();

        // Blob/File garantile (+ Event, FileList, {file} destekli)
        const { blob, filename } = ensureBlob(file);
        form.append("file", blob, filename);

        if (bucket) form.append("bucket", bucket);
        if (folder != null) form.append("folder", folder);
        if (metadata) form.append("metadata", JSON.stringify(metadata));

        const fa: FetchArgs = {
          url: `${BASE}/assets`,
          method: "POST",
          body: form, // boundary otomatik
        };
        return fa;
      },
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    updateStorageAssetAdmin: b.mutation<
      StorageAsset,
      { id: string; body: { name?: string; folder?: string | null; metadata?: StorageMeta } }
    >({
      query: ({ id, body }) =>
        ({ url: `${BASE}/assets/${id}`, method: "PATCH", body } as FetchArgs),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: (_r, _e, arg) => [
        { type: "StorageAsset", id: arg.id },
        { type: "StorageAssets", id: "LIST" },
      ],
    }),

    deleteStorageAssetAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/assets/${id}`, method: "DELETE" } as FetchArgs),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    bulkDeleteStorageAssetsAdmin: b.mutation<{ deleted: number }, { ids: string[] }>({
      query: (body) =>
        ({ url: `${BASE}/assets/bulk-delete`, method: "POST", body } as FetchArgs),
      transformResponse: (res: unknown): { deleted: number } => {
        const obj = (res && typeof res === "object") ? (res as Record<string, unknown>) : {};
        const v = (obj as Record<string, unknown>)["deleted"];
        return { deleted: typeof v === "number" ? v : Number(v ?? 0) || 0 };
      },
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    listStorageFoldersAdmin: b.query<string[], void>({
      query: () => ({ url: `${BASE}/folders` } as FetchArgs),
      transformResponse: (res: unknown): string[] =>
        Array.isArray(res) ? (res as unknown[]).map((x) => String(x)) : [],
      providesTags: [{ type: "StorageFolders" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListStorageAssetsAdminQuery,
  useGetStorageAssetAdminQuery,
  useUploadStorageAssetAdminMutation,
  useUpdateStorageAssetAdminMutation,
  useDeleteStorageAssetAdminMutation,
  useBulkDeleteStorageAssetsAdminMutation,
  useListStorageFoldersAdminQuery,
} = storageAdminApi;
