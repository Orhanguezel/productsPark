// =============================================================
// FILE: src/integrations/rtk/admin/categories_admin.endpoints.ts
// FINAL — Categories Admin RTK (central types+normalizers, BASE constant)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { Category, CategoryListParams, UpsertCategoryBody } from '@/integrations/types';
import {
  normalizeCategory,
  normalizeCategoryList,
  toCategoriesQuery,
  toCategoryUpsertApiBody,
} from '@/integrations/types';

const BASE = '/categories'; // projende admin router bu prefix ile çalışıyor

export const categoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategoriesAdmin: b.query<Category[], CategoryListParams | void>({
      query: (params) => {
        const qs = toCategoriesQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): Category[] => normalizeCategoryList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Categories' as const, id: c.id })),
              { type: 'Categories' as const, id: 'LIST' },
            ]
          : [{ type: 'Categories' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    getCategoryAdminById: b.query<Category, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      providesTags: (_r, _e, id) => [{ type: 'Categories' as const, id }],
    }),

    getCategoryAdminBySlug: b.query<Category | null, string>({
      query: (slug) => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}`, method: 'GET' }),
      transformResponse: (res: unknown): Category | null => (res ? normalizeCategory(res) : null),
      providesTags: (_r, _e, slug) => [{ type: 'Categories' as const, id: `SLUG_${slug}` }],
    }),

    createCategoryAdmin: b.mutation<Category, UpsertCategoryBody>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body: toCategoryUpsertApiBody(body),
      }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      invalidatesTags: [{ type: 'Categories' as const, id: 'LIST' }],
    }),

    updateCategoryAdmin: b.mutation<Category, { id: string; body: UpsertCategoryBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: toCategoryUpsertApiBody(body),
      }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Categories' as const, id: arg.id },
        { type: 'Categories' as const, id: 'LIST' },
      ],
    }),

    deleteCategoryAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Categories' as const, id },
        { type: 'Categories' as const, id: 'LIST' },
      ],
    }),

    reorderCategoriesAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body: { items },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'Categories' as const, id: 'LIST' }],
    }),

    toggleActiveCategoryAdmin: b.mutation<Category, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/active`,
        method: 'PATCH',
        body: { is_active },
      }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Categories' as const, id: arg.id },
        { type: 'Categories' as const, id: 'LIST' },
      ],
    }),

    toggleFeaturedCategoryAdmin: b.mutation<Category, { id: string; is_featured: boolean }>({
      query: ({ id, is_featured }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/featured`,
        method: 'PATCH',
        body: { is_featured },
      }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Categories' as const, id: arg.id },
        { type: 'Categories' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCategoriesAdminQuery,
  useGetCategoryAdminByIdQuery,
  useGetCategoryAdminBySlugQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
  useReorderCategoriesAdminMutation,
  useToggleActiveCategoryAdminMutation,
  useToggleFeaturedCategoryAdminMutation,
} = categoriesAdminApi;
