// =============================================================
// FILE: src/integrations/rtk/admin/storage_admin.endpoints.ts
// FINAL — Admin Storage RTK (fetchBaseQuery-friendly queryFn errors)
// - no any
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { StorageAsset, StorageUpdateInput, StorageListQuery } from '@/integrations/types';
import {
  normalizeStorageAsset,
  normalizeStorageAssetList,
  toStorageListQueryParams,
} from '@/integrations/types';

type ListResponse = { items: StorageAsset[]; total: number };

type BulkCreateErrorItem = {
  file: string;
  error: {
    where?: string;
    message?: string;
    http?: number | null;
  };
};

type BulkCreateResponse = {
  count: number;
  items: Array<StorageAsset | BulkCreateErrorItem>;
};

// NULL-güvenli tag helper
const listTags = (items?: StorageAsset[]) =>
  items && items.length
    ? [
        { type: 'Storage' as const, id: 'LIST' as const },
        ...items.map((r) => ({ type: 'Storage' as const, id: r.id })),
      ]
    : [{ type: 'Storage' as const, id: 'LIST' as const }];

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Storage'] as const });

const customError = (error: string, data?: unknown): FetchBaseQueryError => ({
  status: 'CUSTOM_ERROR',
  error,
  ...(typeof data !== 'undefined' ? { data } : {}),
});

export const storageAdminApi = extendedApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/storage/assets
    listAssetsAdmin: builder.query<ListResponse, Partial<StorageListQuery> | void>({
      query: (q) => {
        const qp = toStorageListQueryParams(q as StorageListQuery | undefined);
        return {
          url: '/admin/storage/assets',
          method: 'GET',
          ...(qp ? { params: qp } : {}),
        } satisfies FetchArgs;
      },
      transformResponse: (res: unknown, meta): ListResponse => {
        const items = normalizeStorageAssetList(res);

        // x-total-count header
        const headers = meta?.response?.headers;
        const totalStr =
          typeof headers?.get === 'function'
            ? headers.get('x-total-count') ?? headers.get('X-Total-Count')
            : null;

        const total = totalStr && String(totalStr).trim() ? Number(totalStr) : items.length;
        return { items, total: Number.isFinite(total) ? total : items.length };
      },
      providesTags: (res) => listTags(res?.items),
    }),

    // GET /admin/storage/assets/:id
    getAssetAdmin: builder.query<StorageAsset, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): StorageAsset => normalizeStorageAsset(res),
      providesTags: (res) => (res?.id ? [{ type: 'Storage' as const, id: res.id }] : []),
    }),

    // POST /admin/storage/assets (multipart)
    createAssetAdmin: builder.mutation<
      StorageAsset,
      {
        file: File;
        bucket: string;
        folder?: string;
        metadata?: Record<string, string> | null;
      }
    >({
      queryFn: async (args, _api, _extra, baseQuery) => {
        try {
          const fd = new FormData();
          fd.append('file', args.file, args.file.name);
          fd.append('bucket', args.bucket);
          if (args.folder) fd.append('folder', args.folder);
          if (args.metadata) fd.append('metadata', JSON.stringify(args.metadata));

          const res = await baseQuery({
            url: '/admin/storage/assets',
            method: 'POST',
            body: fd,
          });

          if (res.error) {
            // fetchBaseQuery error tipini aynen döndür
            return { error: res.error as FetchBaseQueryError };
          }

          return { data: normalizeStorageAsset(res.data) };
        } catch (e) {
          return {
            error: customError('create_failed', e instanceof Error ? { message: e.message } : e),
          };
        }
      },
      invalidatesTags: (res) =>
        res?.id
          ? [
              { type: 'Storage' as const, id: res.id },
              { type: 'Storage' as const, id: 'LIST' },
            ]
          : [{ type: 'Storage' as const, id: 'LIST' }],
    }),

    // POST /admin/storage/assets/bulk (multipart; files[])
    bulkCreateAssetsAdmin: builder.mutation<
      BulkCreateResponse,
      {
        files: File[];
        bucket: string;
        folder?: string;
        metadata?: Record<string, string> | null;
      }
    >({
      queryFn: async (args, _api, _extra, baseQuery) => {
        try {
          const fd = new FormData();
          fd.append('bucket', args.bucket);
          if (args.folder) fd.append('folder', args.folder);
          if (args.metadata) fd.append('metadata', JSON.stringify(args.metadata));

          for (const f of args.files) fd.append('files', f, f.name);

          const res = await baseQuery({
            url: '/admin/storage/assets/bulk',
            method: 'POST',
            body: fd,
          });

          if (res.error) {
            return { error: res.error as FetchBaseQueryError };
          }

          // backend mixed items dönüyor olabilir; asset olanları normalize edelim
          const payload = (res.data ?? {}) as {
            count?: unknown;
            items?: unknown;
          };

          const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
          const mapped: Array<StorageAsset | BulkCreateErrorItem> = itemsRaw.map((x) => {
            const obj = (x && typeof x === 'object' ? x : null) as Record<string, unknown> | null;

            // error item heuristics
            if (obj && typeof obj.file === 'string' && obj.error && typeof obj.error === 'object') {
              const errObj = obj.error as Record<string, unknown>;
              return {
                file: obj.file,
                error: {
                  ...(typeof errObj.where === 'string' ? { where: errObj.where } : {}),
                  ...(typeof errObj.message === 'string' ? { message: errObj.message } : {}),
                  ...(typeof errObj.http === 'number' || errObj.http === null
                    ? { http: errObj.http as number | null }
                    : {}),
                },
              };
            }

            return normalizeStorageAsset(x);
          });

          const count = Number.isFinite(Number(payload.count))
            ? Number(payload.count)
            : mapped.length;

          return { data: { count, items: mapped } };
        } catch (e) {
          return {
            error: customError(
              'bulk_create_failed',
              e instanceof Error ? { message: e.message } : e,
            ),
          };
        }
      },
      invalidatesTags: () => [{ type: 'Storage' as const, id: 'LIST' }],
    }),

    // PATCH /admin/storage/assets/:id
    patchAssetAdmin: builder.mutation<StorageAsset, { id: string; body: StorageUpdateInput }>({
      query: ({ id, body }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): StorageAsset => normalizeStorageAsset(res),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage' as const, id: arg.id },
        { type: 'Storage' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/storage/assets/:id
    deleteAssetAdmin: builder.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage' as const, id: arg.id },
        { type: 'Storage' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/storage/assets/bulk-delete
    bulkDeleteAssetsAdmin: builder.mutation<{ deleted: number }, { ids: string[] }>({
      query: ({ ids }) => ({
        url: '/admin/storage/assets/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      transformResponse: (res: unknown): { deleted: number } => {
        const obj = (res && typeof res === 'object' ? res : {}) as Record<string, unknown>;
        const deleted = Number.isFinite(Number(obj.deleted)) ? Number(obj.deleted) : 0;
        return { deleted };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Storage' as const, id: 'LIST' },
        ...arg.ids.map((id) => ({ type: 'Storage' as const, id })),
      ],
    }),

    // GET /admin/storage/folders
    listFoldersAdmin: builder.query<string[], void>({
      query: () => ({ url: '/admin/storage/folders', method: 'GET' }),
      transformResponse: (res: unknown): string[] => {
        if (Array.isArray(res)) return res.filter((x) => typeof x === 'string') as string[];
        return [];
      },
      providesTags: () => [{ type: 'Storage' as const, id: 'FOLDERS' }],
    }),

    // GET /admin/storage/_diag/cloud
    diagCloudinaryAdmin: builder.query<
      { ok: boolean; cloud: string; uploaded?: { public_id: string; secure_url: string } },
      void
    >({
      query: () => ({ url: '/admin/storage/_diag/cloud', method: 'GET' }),
      transformResponse: (res: unknown) => {
        const o = (res && typeof res === 'object' ? res : {}) as Record<string, unknown>;
        const ok = o.ok === true || o.ok === 1 || o.ok === '1';
        const cloud = typeof o.cloud === 'string' ? o.cloud : '';
        const up =
          o.uploaded && typeof o.uploaded === 'object'
            ? (o.uploaded as Record<string, unknown>)
            : null;

        const uploaded =
          up && typeof up.public_id === 'string' && typeof up.secure_url === 'string'
            ? { public_id: up.public_id, secure_url: up.secure_url }
            : undefined;

        return { ok, cloud, ...(uploaded ? { uploaded } : {}) };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAssetsAdminQuery,
  useGetAssetAdminQuery,
  useCreateAssetAdminMutation,
  useBulkCreateAssetsAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
  useDiagCloudinaryAdminQuery,
} = storageAdminApi;
