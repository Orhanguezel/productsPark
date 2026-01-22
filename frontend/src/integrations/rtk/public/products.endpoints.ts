// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/products.endpoints.ts
// FINAL — Public Products RTK (list + listWithMeta + get + getBySlug)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  Product,
  ProductsPublicListParams,
  ProductsListResult,
} from '@/integrations/types';

import {
  normalizeProductsPublic,
  normalizeProductsPublicWithMeta,
  normalizeProductPublic,
  toProductsPublicListQuery,
} from '@/integrations/types';

const BASE = '/products';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProducts: b.query<Product[], ProductsPublicListParams | void>({
      query: (params): FetchArgs => {
        const qp = params ? toProductsPublicListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): Product[] => normalizeProductsPublic(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Products' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'Products' as const, id: 'PUBLIC_LIST' }],
      keepUnusedDataFor: 60,
    }),

    listProductsWithMeta: b.query<ProductsListResult, ProductsPublicListParams | void>({
      query: (params): FetchArgs => {
        const qp = params ? toProductsPublicListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): ProductsListResult => normalizeProductsPublicWithMeta(res),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Products' as const, id: 'PUBLIC_LIST_WITH_META' },
            ]
          : [{ type: 'Products' as const, id: 'PUBLIC_LIST_WITH_META' }],
      keepUnusedDataFor: 60,
    }),

    getProduct: b.query<Product, string>({
      query: (idOrSlug): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(idOrSlug)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): Product => {
        const obj = Array.isArray(res) ? res[0] : res;
        return normalizeProductPublic(obj);
      },
      providesTags: (_r, _e, idOrSlug) => [{ type: 'Product' as const, id: idOrSlug }],
      keepUnusedDataFor: 300,
    }),

    getProductBySlug: b.query<Product, string>({
      query: (slug): FetchArgs => ({
        url: `${BASE}/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): Product => normalizeProductPublic(res),
      providesTags: (_r, _e, slug) => [{ type: 'Product' as const, id: `SLUG:${slug}` }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductsQuery,
  useListProductsWithMetaQuery,
  useGetProductQuery,
  useGetProductBySlugQuery,
} = productsApi;
