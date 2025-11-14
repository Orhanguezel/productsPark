// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_stock.endpoints.ts
// (Public product stock)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Stock } from "@/integrations/metahub/db/types/products";

type ListStockParams = {
  product_id?: string;
  is_used?: boolean | 0 | 1;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const pluckArray = (res: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const normalizeStock = (row: Stock): Stock => ({
  ...row,
  code: row.code ?? row.stock_content,
});

export const productStockApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductStock: b.query<Stock[], ListStockParams | void>({
      query: (params): FetchArgs => {
        const qp: Record<string, string | number> = {};
        if (params && (params as ListStockParams).product_id) {
          qp.product_id = (params as ListStockParams).product_id as string;
        }
        if (params && (params as ListStockParams).is_used !== undefined) {
          const isUsed = (params as ListStockParams).is_used;
          qp.is_used = isUsed ? 1 : 0;
        }
        return { url: "/products/stock", params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): Stock[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "stock"]);
        return rows.filter(isRecord).map((x) => normalizeStock(x as Stock));
      },
      // stok güncelleme admin tarafında Product tag'ini invalid ediyor
      providesTags: (_result, _e, arg) => {
        const params = (arg || {}) as ListStockParams;
        return params.product_id
          ? [{ type: "Product" as const, id: params.product_id }]
          : [];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductStockQuery } = productStockApi;
