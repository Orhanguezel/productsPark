// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/media_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

// helpers
const toIso2 = (x: unknown): string => {
  const d = x instanceof Date ? x : new Date(x as string | number);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const tryParse2 = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

export type MediaMeta = Record<string, string> | null;

export type MediaAsset = {
  id: string;
  name: string;
  path: string;
  folder: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  metadata: MediaMeta;
  created_at: string;
  updated_at: string;
};

export type ApiMediaAsset = Omit<
  MediaAsset,
  "size" | "width" | "height" | "metadata" | "created_at" | "updated_at"
> & {
  size: number | string;
  width?: number | string | null;
  height?: number | string | null;
  metadata: string | MediaMeta;
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

const normalizeAsset = (a: ApiMediaAsset): MediaAsset => ({
  ...a,
  size: toNum(a.size),
  width: a.width == null ? null : toNum(a.width),
  height: a.height == null ? null : toNum(a.height),
  metadata: a.metadata == null ? null : tryParse2<MediaMeta>(a.metadata),
  created_at: toIso2(a.created_at),
  updated_at: toIso2(a.updated_at),
});

export type MediaListParams = {
  q?: string;
  folder?: string | null;
  mime?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "name" | "size";
  order?: "asc" | "desc";
};

export type UpdateAssetBody = { name?: string; folder?: string | null; metadata?: MediaMeta };
export type BulkDeleteBody = { ids: string[] };
export type SignedUrlResp = { url: string; expires_at: string | null };

/** MediaListParams -> güvenli fetch params */
function toFetchParams(
  p: MediaListParams
): Record<string, string | number | boolean | undefined> {
  return {
    q: p.q,
    folder: p.folder ?? undefined,
    mime: p.mime,
    limit: p.limit,
    offset: p.offset,
    sort: p.sort,
    order: p.order,
  };
}

export const mediaAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listMediaAssetsAdmin: b.query<MediaAsset[], MediaListParams | void>({
      query: (params) => {
        const args: {
          url: string;
          params?: Record<string, string | number | boolean | undefined>;
        } = { url: "/admin/media/assets" };
        if (params) args.params = toFetchParams(params);
        return args;
      },
      transformResponse: (res: unknown): MediaAsset[] => {
        if (Array.isArray(res)) return (res as ApiMediaAsset[]).map(normalizeAsset);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data)
          ? (maybe.data as ApiMediaAsset[]).map(normalizeAsset)
          : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "MediaAsset" as const, id: a.id })),
              { type: "MediaAssets" as const, id: "LIST" },
            ]
          : [{ type: "MediaAssets" as const, id: "LIST" }],
    }),

    getMediaAssetAdmin: b.query<MediaAsset, string>({
      query: (id) => ({ url: `/admin/media/assets/${id}` }),
      transformResponse: (res: unknown): MediaAsset => normalizeAsset(res as ApiMediaAsset),
      providesTags: (_r, _e, id) => [{ type: "MediaAsset", id }],
    }),

    // Upload via multipart/form-data
    uploadMediaAssetAdmin: b.mutation<MediaAsset, { file: File; folder?: string | null; metadata?: MediaMeta }>({
      query: ({ file, folder, metadata }) => {
        const form = new FormData();
        form.append("file", file);
        if (folder != null) form.append("folder", folder);
        if (metadata) form.append("metadata", JSON.stringify(metadata));
        return { url: "/admin/media/assets", method: "POST", body: form } as const;
      },
      transformResponse: (res: unknown): MediaAsset => normalizeAsset(res as ApiMediaAsset),
      invalidatesTags: [{ type: "MediaAssets" as const, id: "LIST" }],
    }),

    updateMediaAssetAdmin: b.mutation<MediaAsset, { id: string; body: UpdateAssetBody }>({
      query: ({ id, body }) => ({ url: `/admin/media/assets/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): MediaAsset => normalizeAsset(res as ApiMediaAsset),
      invalidatesTags: (_r, _e, arg) => [
        { type: "MediaAsset", id: arg.id },
        { type: "MediaAssets", id: "LIST" },
      ],
    }),

    deleteMediaAssetAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/media/assets/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "MediaAssets" as const, id: "LIST" }],
    }),

    bulkDeleteMediaAssetsAdmin: b.mutation<{ deleted: number }, BulkDeleteBody>({
      query: (body) => ({ url: "/admin/media/assets/bulk-delete", method: "POST", body }),
      transformResponse: (res: unknown): { deleted: number } => ({
        deleted: Number((res as { deleted?: unknown })?.deleted ?? 0),
      }),
      invalidatesTags: [{ type: "MediaAssets" as const, id: "LIST" }],
    }),

    getSignedUrlMediaAdmin: b.mutation<SignedUrlResp, { id: string; variant?: "original" | "thumb" | "webp" }>({
      query: ({ id, variant }) => ({
        url: `/admin/media/assets/${id}/signed-url`,
        method: "POST",
        body: { variant },
      }),
      transformResponse: (res: unknown): SignedUrlResp => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return {
          url: String(r?.url ?? ""),
          expires_at: r?.expires_at ? toIso2(r.expires_at) : null,
        };
      },
    }),

    // Folders
    listMediaFoldersAdmin: b.query<string[], void>({
      query: () => ({ url: "/admin/media/folders" }),
      transformResponse: (res: unknown): string[] =>
        Array.isArray(res) ? (res as unknown[]).map(String) : [],
      providesTags: [{ type: "MediaFolders" as const, id: "LIST" }],
    }),

    createMediaFolderAdmin: b.mutation<{ ok: true }, { name: string }>({
      query: (body) => ({ url: "/admin/media/folders", method: "POST", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "MediaFolders" as const, id: "LIST" }],
    }),

    deleteMediaFolderAdmin: b.mutation<{ ok: true }, { name: string }>({
      query: (body) => ({ url: "/admin/media/folders", method: "DELETE", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "MediaFolders" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMediaAssetsAdminQuery,
  useGetMediaAssetAdminQuery,
  useUploadMediaAssetAdminMutation,
  useUpdateMediaAssetAdminMutation,
  useDeleteMediaAssetAdminMutation,
  useBulkDeleteMediaAssetsAdminMutation,
  useGetSignedUrlMediaAdminMutation,
  useListMediaFoldersAdminQuery,
  useCreateMediaFolderAdminMutation,
  useDeleteMediaFolderAdminMutation,
} = mediaAdminApi;
