// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_options.endpoints.ts
// FINAL — Public Product Options RTK (list)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { ProductOption, ProductOptionsListParams } from '@/integrations/types';
import { normalizeProductOptions, toPublicProductOptionsQuery } from '@/integrations/types';

export const productOptionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /products/options?product_id=
    listProductOptions: b.query<ProductOption[], ProductOptionsListParams | void>({
      query: (params): FetchArgs => {
        const qp = toPublicProductOptionsQuery(params);
        return { url: '/products/options', method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): ProductOption[] => normalizeProductOptions(res),
      providesTags: (_r, _e, arg) => {
        const p = (arg ?? {}) as ProductOptionsListParams;
        return p.product_id ? [{ type: 'ProductOptions' as const, id: p.product_id }] : [];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductOptionsQuery } = productOptionsApi;
