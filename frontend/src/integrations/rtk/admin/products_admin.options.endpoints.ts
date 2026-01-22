// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.options.endpoints.ts
// FINAL — Admin Product Options RTK (CRUD)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ProductOption,
  ProductOptionCreateInput,
  ProductOptionUpdateInput,
} from '@/integrations/types';
import {
  normalizeProductOption,
  normalizeProductOptions,
  toProductOptionCreateBody,
  toProductOptionUpdateBody,
} from '@/integrations/types';

const BASE = '/admin/products';

export const productOptionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/options
    listProductOptionsAdmin: b.query<ProductOption[], string>({
      query: (productId): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(productId)}/options`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): ProductOption[] => normalizeProductOptions(res),
      providesTags: (_r, _e, productId) => [{ type: 'ProductOptions' as const, id: productId }],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/options
    createProductOptionAdmin: b.mutation<
      ProductOption,
      { id: string; body: ProductOptionCreateInput }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/options`,
        method: 'POST',
        body: toProductOptionCreateBody(body),
      }),
      transformResponse: (res: unknown): ProductOption => normalizeProductOption(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductOptions' as const, id: arg.id }],
    }),

    // PATCH /admin/products/:id/options/:optionId
    updateProductOptionAdmin: b.mutation<
      ProductOption,
      { id: string; optionId: string; body: ProductOptionUpdateInput }
    >({
      query: ({ id, optionId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/options/${encodeURIComponent(optionId)}`,
        method: 'PATCH',
        body: toProductOptionUpdateBody(body),
      }),
      transformResponse: (res: unknown): ProductOption => normalizeProductOption(res),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductOptions' as const, id: arg.id }],
    }),

    // DELETE /admin/products/:id/options/:optionId
    deleteProductOptionAdmin: b.mutation<{ ok: true }, { id: string; optionId: string }>({
      query: ({ id, optionId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/options/${encodeURIComponent(optionId)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'ProductOptions' as const, id: arg.id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductOptionsAdminQuery,
  useCreateProductOptionAdminMutation,
  useUpdateProductOptionAdminMutation,
  useDeleteProductOptionAdminMutation,
} = productOptionsAdminApi;
