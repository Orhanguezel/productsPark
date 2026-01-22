// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints.ts
// FINAL — Admin Products RTK (CRUD + bulk + toggles)
// - IMPORTANT: Stock endpoints are NOT defined here (moved to products_admin.stock.endpoints.ts)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ProductAdmin,
  ProductsAdminListParams,
  CreateProductBody,
  UpdateProductBody,
} from '@/integrations/types';

import {
  normalizeProductsAdmin,
  normalizeProductAdmin,
  toProductsAdminListQuery,
  toProductAdminApiBody,
} from '@/integrations/types';

const BASE = '/admin/products';

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products
    listProductsAdmin: b.query<ProductAdmin[], ProductsAdminListParams | void>({
      query: (params): FetchArgs => {
        const qp = params ? toProductsAdminListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): ProductAdmin[] => normalizeProductsAdmin(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Products' as const, id: 'LIST' },
            ]
          : [{ type: 'Products' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/products/:id
    getProductAdmin: b.query<ProductAdmin, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): ProductAdmin => {
        const obj = Array.isArray(res) ? res[0] : res;
        return normalizeProductAdmin(obj);
      },
      providesTags: (_r, _e, id) => [{ type: 'Product' as const, id }],
      keepUnusedDataFor: 300,
    }),

    // POST /admin/products
    createProductAdmin: b.mutation<ProductAdmin, CreateProductBody>({
      query: (body): FetchArgs => ({
        url: BASE,
        method: 'POST',
        body: toProductAdminApiBody(body),
      }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProductAdmin(res),
      invalidatesTags: [{ type: 'Products' as const, id: 'LIST' }],
    }),

    // PATCH /admin/products/:id
    updateProductAdmin: b.mutation<ProductAdmin, { id: string; body: UpdateProductBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toProductAdminApiBody(body),
      }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProductAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Product' as const, id: arg.id },
        { type: 'Products' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/products/:id
    deleteProductAdmin: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Product' as const, id },
        { type: 'Products' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/products/bulk/active
    bulkSetActiveAdmin: b.mutation<{ ok: true }, { ids: string[]; is_active: boolean }>({
      query: ({ ids, is_active }): FetchArgs => ({
        url: `${BASE}/bulk/active`,
        method: 'POST',
        body: { ids, is_active },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'Products' as const, id: 'LIST' }],
    }),

    // POST /admin/products/bulk/reorder
    reorderProductsAdmin: b.mutation<
      { ok: true },
      { items: Array<{ id: string; display_order: number }> }
    >({
      query: (body): FetchArgs => ({
        url: `${BASE}/bulk/reorder`,
        method: 'POST',
        body,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'Products' as const, id: 'LIST' }],
    }),

    // PATCH /admin/products/:id/active
    toggleActiveProductAdmin: b.mutation<ProductAdmin, { id: string; is_active: boolean }>({
      query: ({ id, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/active`,
        method: 'PATCH',
        body: { is_active },
      }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProductAdmin(res),
      invalidatesTags: (_r, _e, a) => [
        { type: 'Product' as const, id: a.id },
        { type: 'Products' as const, id: 'LIST' },
      ],
    }),

    // PATCH /admin/products/:id/homepage
    toggleHomepageProductAdmin: b.mutation<ProductAdmin, { id: string; show_on_homepage: boolean }>(
      {
        query: ({ id, show_on_homepage }): FetchArgs => ({
          url: `${BASE}/${encodeURIComponent(id)}/homepage`,
          method: 'PATCH',
          body: {
            // compat: ikisini de yolla
            show_on_homepage: show_on_homepage ? 1 : 0,
            is_featured: show_on_homepage ? 1 : 0,
          },
        }),
        transformResponse: (res: unknown): ProductAdmin => normalizeProductAdmin(res),
        invalidatesTags: (_r, _e, a) => [
          { type: 'Product' as const, id: a.id },
          { type: 'Products' as const, id: 'LIST' },
        ],
      },
    ),
  }),
  overrideExisting: true,
});

export const {
  useListProductsAdminQuery,
  useGetProductAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useDeleteProductAdminMutation,
  useBulkSetActiveAdminMutation,
  useReorderProductsAdminMutation,
  useToggleActiveProductAdminMutation,
  useToggleHomepageProductAdminMutation,
} = productsAdminApi;
