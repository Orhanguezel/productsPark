// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_stock.endpoints.ts
// FINAL — Public product stock RTK
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { Stock, ProductStockListParams } from '@/integrations/types';
import { normalizeStocks, toPublicProductStockQuery } from '@/integrations/types';

export const productStockApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /products/stock?product_id=&is_used=
    listProductStock: b.query<Stock[], ProductStockListParams | void>({
      query: (params): FetchArgs => {
        const qp = toPublicProductStockQuery(params);
        return { url: '/products/stock', method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): Stock[] => normalizeStocks(res),
      providesTags: (_r, _e, arg) => {
        const p = (arg ?? {}) as ProductStockListParams;
        return p.product_id ? [{ type: 'Product' as const, id: p.product_id }] : [];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductStockQuery } = productStockApi;
