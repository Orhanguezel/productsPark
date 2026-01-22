// =============================================================
// FILE: src/integrations/rtk/public/categories_public.endpoints.ts
// FINAL — Categories Public RTK (central types+normalizers, BASE constant)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { Category, CategoryListParams } from '@/integrations/types';
import { normalizeCategory, normalizeCategoryList, toCategoriesQuery } from '@/integrations/types';

const BASE = '/categories';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategories: b.query<Category[], CategoryListParams | void>({
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
      keepUnusedDataFor: 60,
    }),

    getCategoryById: b.query<Category, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Category => normalizeCategory(res),
      providesTags: (_r, _e, id) => [{ type: 'Categories' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCategoriesQuery, useGetCategoryByIdQuery } = categoriesApi;
