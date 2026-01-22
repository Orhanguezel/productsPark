// =============================================================
// FILE: src/integrations/rtk/public/custom_pages_public.endpoints.ts
// FINAL — Custom Pages Public RTK Endpoints (central types+helpers)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { CustomPageView, CustomPagesPublicListParams } from '@/integrations/types';
import { normalizeCustomPage, buildCustomPagesPublicListQuery } from '@/integrations/types';

const BASE = '/custom_pages';

export const customPagesPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPages: b.query<CustomPageView[], CustomPagesPublicListParams>({
      query: (params) => {
        const qs = buildCustomPagesPublicListQuery(params);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): CustomPageView[] =>
        Array.isArray(res) ? res.map(normalizeCustomPage) : [],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((p) => ({ type: 'CustomPage' as const, id: p.id })),
              { type: 'CustomPages' as const, id: 'LIST' },
            ]
          : [{ type: 'CustomPages' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getCustomPageBySlug: b.query<CustomPageView, { slug: string }>({
      query: ({ slug }) => ({
        url: `${BASE}/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      providesTags: (_r, _e, { slug }) => [{ type: 'CustomPage' as const, id: `SLUG_${slug}` }],
    }),

    getCustomPageByModuleSlug: b.query<CustomPageView, { module_key: string; slug: string }>({
      query: ({ module_key, slug }) => ({
        url: `${BASE}/by-module/${encodeURIComponent(module_key)}/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      providesTags: (_r, _e, { module_key, slug }) => [
        { type: 'CustomPage' as const, id: `MS_${module_key}_${slug}` },
      ],
    }),

    getCustomPageById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): CustomPageView => normalizeCustomPage(res),
      providesTags: (_r, _e, id) => [{ type: 'CustomPage' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesQuery,
  useGetCustomPageBySlugQuery,
  useGetCustomPageByModuleSlugQuery,
  useGetCustomPageByIdQuery,
} = customPagesPublicApi;
