// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";

// utils (type-safe)
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

export type StorageMeta = Record<string, string> | null;
export type StorageAsset = {
  id: string;
  name: string;
  bucket: string;
  path: string;
  folder: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  metadata: StorageMeta;
  created_at: string;
  updated_at: string;
};

export type ApiStorageAsset = Omit<StorageAsset, "size" | "width" | "height" | "metadata" | "created_at" | "updated_at"> & {
  size: number | string;
  width?: number | string | null;
  height?: number | string | null;
  metadata: string | StorageMeta;
  created_at: string | number | Date;
  updated_at: string | number | Date;
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

export type StorageListParams = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "name" | "size";
  order?: "asc" | "desc";
};

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

export const storageAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listStorageAssetsAdmin: b.query<StorageAsset[], StorageListParams | void>({
      query: (params) => ({ url: "/admin/storage/assets", params: params ? toParams(params) : undefined }),
      transformResponse: (res: unknown): StorageAsset[] => {
        if (Array.isArray(res)) return (res as ApiStorageAsset[]).map(normalize);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiStorageAsset[]).map(normalize) : [];
      },
      providesTags: (result) =>
        result
          ? [...result.map((a) => ({ type: "StorageAsset" as const, id: a.id })), { type: "StorageAssets" as const, id: "LIST" }]
          : [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    getStorageAssetAdmin: b.query<StorageAsset, string>({
      query: (id) => ({ url: `/admin/storage/assets/${id}` }),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      providesTags: (_r, _e, id) => [{ type: "StorageAsset", id }],
    }),

    uploadStorageAssetAdmin: b.mutation<StorageAsset, { file: File; bucket?: string; folder?: string | null; metadata?: StorageMeta }>({
      query: ({ file, bucket, folder, metadata }) => {
        const form = new FormData();
        form.append("file", file);
        if (bucket) form.append("bucket", bucket);
        if (folder != null) form.append("folder", folder);
        if (metadata) form.append("metadata", JSON.stringify(metadata));
        return { url: "/admin/storage/assets", method: "POST", body: form } as const;
      },
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    updateStorageAssetAdmin: b.mutation<StorageAsset, { id: string; body: { name?: string; folder?: string | null; metadata?: StorageMeta } }>({
      query: ({ id, body }) => ({ url: `/admin/storage/assets/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: (_r, _e, arg) => [{ type: "StorageAsset", id: arg.id }, { type: "StorageAssets", id: "LIST" }],
    }),

    deleteStorageAssetAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/storage/assets/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    bulkDeleteStorageAssetsAdmin: b.mutation<{ deleted: number }, { ids: string[] }>({
      query: (body) => ({ url: "/admin/storage/assets/bulk-delete", method: "POST", body }),
      transformResponse: (res: unknown): { deleted: number } => {
        const obj = (res && typeof res === "object") ? (res as Record<string, unknown>) : {};
        const v = obj["deleted"];
        return { deleted: typeof v === "number" ? v : Number(v ?? 0) || 0 };
      },
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    listStorageFoldersAdmin: b.query<string[], void>({
      query: () => ({ url: "/admin/storage/folders" }),
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
