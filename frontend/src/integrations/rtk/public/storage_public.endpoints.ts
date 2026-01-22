// =============================================================
// FILE: src/integrations/rtk/public/storage_public.endpoints.ts
// FINAL — Public Storage: deterministic upload + sign-multipart
// - no helpers/normalizers here (moved to types)
// - queryFn returns FetchBaseQueryError (project-narrow status supported)
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';

import type {
  StorageServerUploadArgs,
  StoragePublicUploadResponse,
  StorageSignMultipartBody,
  StorageSignMultipartResponse,
} from '@/integrations/types';

import {
  compactFiles,
  sanitizeFilename,
  buildStorageUploadUrl,
  isPlainObject,
  makeFetchError,
  normalizeBaseQueryError,
} from '@/integrations/types';

type UploadManyResponse = { items: StoragePublicUploadResponse[] };

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['Storage'] as const,
});

export const storagePublicApi = extendedApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadToBucket: builder.mutation<
      UploadManyResponse,
      Omit<StorageServerUploadArgs, 'file'> & { files: File | File[] }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        const rawList = Array.isArray(args.files) ? args.files : [args.files];
        const files = compactFiles(rawList);

        if (!files.length) {
          return { error: makeFetchError(400, { message: 'no_files' }) };
        }

        const items: StoragePublicUploadResponse[] = [];

        for (const [i, file] of files.entries()) {
          const fd = new FormData();
          const safeName = sanitizeFilename(file.name || `file-${i}`);
          fd.append('file', file, safeName);

          const url = buildStorageUploadUrl({
            bucket: args.bucket,
          });

          const res = await baseQuery({ url, method: 'POST', body: fd });

          if (res.error) {
            return { error: normalizeBaseQueryError(res.error) };
          }

          const data = res.data;

          if (!isPlainObject(data)) {
            return {
              error: makeFetchError('CUSTOM_ERROR', { message: 'invalid_upload_response' }),
            };
          }

          const path = typeof data.path === 'string' ? data.path : '';
          const fileUrl = typeof data.url === 'string' ? data.url : '';

          items.push({ path, url: fileUrl });
        }

        return { data: { items } };
      },
      invalidatesTags: [{ type: 'Storage' as const, id: 'LIST' }],
    }),

    signMultipart: builder.mutation<
      StorageSignMultipartResponse,
      StorageSignMultipartBody & { content_type?: string }
    >({
      query: ({ filename, folder, content_type }) => ({
        url: '/storage/uploads/sign-multipart',
        method: 'POST',
        body: {
          filename,
          ...(folder ? { folder } : {}),
          ...(content_type ? { content_type } : {}),
        },
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useUploadToBucketMutation, useSignMultipartMutation } = storagePublicApi;
