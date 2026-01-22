// =============================================================
// FILE: src/integrations/rtk/admin/custom_pages_admin.endpoints.ts
// FINAL — Custom Pages Admin RTK Endpoints (central types+helpers)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  CustomPageView,
  UpsertCustomPageBody,
  PatchCustomPageBody,
  CustomPagesAdminListParams,
} from '@/integrations/types';
import {
  normalizeCustomPage,
  toCustomPageApiBody,
  toCustomPageApiPatchBody,
  buildCustomPagesAdminListQuery,
} from '@/integrations/types';

const BASE = '/admin/custom_pages';

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPagesAdmin: b.query<CustomPageView[], CustomPagesAdminListParams | void>({
      query: (params) => {
        const qs = buildCustomPagesAdminListQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): CustomPageView[] =>
        Array.isArray(res) ? res.map(normalizeCustomPage) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'CustomPages' as const, id: p.id })),
              { type: 'CustomPages' as const, id: 'LIST' },
            ]
          : [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),

    getCustomPageAdminById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      providesTags: (_r, _e, id) => [{ type: 'CustomPages' as const, id }],
    }),

    createCustomPageAdmin: b.mutation<CustomPageView, UpsertCustomPageBody>({
      query: (body) => ({ url: BASE, method: 'POST', body: toCustomPageApiBody(body) }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      invalidatesTags: [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),

    updateCustomPageAdmin: b.mutation<CustomPageView, { id: string; body: PatchCustomPageBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toCustomPageApiPatchBody(body),
      }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'CustomPages' as const, id: arg.id },
        { type: 'CustomPages' as const, id: 'LIST' },
      ],
    }),

    deleteCustomPageAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'CustomPages' as const, id },
        { type: 'CustomPages' as const, id: 'LIST' },
      ],
    }),

    /**
     * Görsel set/kaldır:
     * backend body: { asset_id?, image_url?, alt? }
     * FE standardı: { image_asset_id?, image_url?, image_alt? }
     */
    setCustomPageImageAdmin: b.mutation<
      CustomPageView,
      {
        id: string;
        body: {
          image_asset_id?: string | null;
          image_url?: string | null;
          image_alt?: string | null;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/image`,
        method: 'PATCH',
        body: {
          asset_id: typeof body.image_asset_id !== 'undefined' ? body.image_asset_id : undefined,
          image_url: typeof body.image_url !== 'undefined' ? body.image_url : undefined,
          alt: typeof body.image_alt !== 'undefined' ? body.image_alt : undefined,
        },
      }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'CustomPages' as const, id: arg.id },
        { type: 'CustomPages' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesAdminQuery,
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useSetCustomPageImageAdminMutation,
} = customPagesAdminApi;
