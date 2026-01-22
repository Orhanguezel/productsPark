// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.stock.endpoints.ts
// FINAL — Admin product stock RTK (list + set + delete + used)
// - SINGLE SOURCE OF TRUTH for stock endpoints (no duplicates elsewhere)
// - setProductStockAdmin args: { id, lines } (no body wrapper)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { Stock, UsedStockItem, ProductStockAdminListParams } from '@/integrations/types';

import {
  normalizeStocks,
  normalizeUsedStockItems,
  toAdminProductStockQuery,
  toProductStockSetBody,
} from '@/integrations/types';

const BASE = '/admin/products';

export const productStockAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/stock
    listProductStockAdmin: b.query<
      Stock[],
      { id: string; params?: ProductStockAdminListParams | void }
    >({
      query: ({ id, params }): FetchArgs => {
        const qp = toAdminProductStockQuery(params);
        return {
          url: `${BASE}/${encodeURIComponent(id)}/stock`,
          method: 'GET',
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): Stock[] => normalizeStocks(res),
      providesTags: (_r, _e, arg) => [{ type: 'ProductStock' as const, id: arg.id }],
      keepUnusedDataFor: 60,
    }),

    // PUT /admin/products/:id/stock   body: { lines: string[] }
    // ✅ args are { id, lines } to keep ProductForm simple and avoid "body" mismatch
    setProductStockAdmin: b.mutation<
      { updated_stock_quantity: number },
      { id: string; lines: string[] }
    >({
      query: ({ id, lines }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/stock`,
        method: 'PUT',
        // ✅ hardened mapper: always passes {lines: []} even if lines undefined
        body: toProductStockSetBody({ lines: Array.isArray(lines) ? lines : [] }),
      }),
      transformResponse: (res: unknown): { updated_stock_quantity: number } => {
        const r = (res ?? {}) as Record<string, unknown>;
        const n = Number(r.updated_stock_quantity ?? 0);
        return { updated_stock_quantity: Number.isFinite(n) ? n : 0 };
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductStock' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id }, // stock_quantity update
      ],
    }),

    // DELETE /admin/products/:id/stock/:stockId
    deleteProductStockLineAdmin: b.mutation<
      { ok: true; updated_stock_quantity?: number },
      { id: string; stockId: string }
    >({
      query: ({ id, stockId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/stock/${encodeURIComponent(stockId)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): { ok: true; updated_stock_quantity?: number } => {
        const r = (res ?? {}) as Record<string, unknown>;
        const n = Number(r.updated_stock_quantity ?? NaN);
        return {
          ok: true as const,
          ...(Number.isFinite(n) ? { updated_stock_quantity: n } : {}),
        };
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductStock' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id },
      ],
    }),

    // GET /admin/products/:id/stock/used
    listUsedStockAdmin: b.query<UsedStockItem[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/stock/used`,
        method: 'GET',
        params: {
          ...(typeof limit === 'number' ? { limit } : {}),
          ...(typeof offset === 'number' ? { offset } : {}),
        },
      }),
      transformResponse: (res: unknown): UsedStockItem[] => normalizeUsedStockItems(res),
      providesTags: (_r, _e, arg) => [{ type: 'ProductStockUsed' as const, id: arg.id }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductStockAdminQuery,
  useSetProductStockAdminMutation,
  useDeleteProductStockLineAdminMutation,
  useListUsedStockAdminQuery,
} = productStockAdminApi;
