// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/stock_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi3 } from "../../baseApi";

const toIso3 = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toNum3 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type StockItem = {
  id: string;
  sku: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  low_stock_threshold: number | null;
  updated_at: string;
};

export type ApiStockItem = Omit<StockItem, "quantity" | "low_stock_threshold" | "updated_at"> & {
  quantity: number | string;
  low_stock_threshold: number | string | null;
  updated_at: string | number | Date;
};

const normalizeStockItem = (s: ApiStockItem): StockItem => ({
  ...s,
  quantity: toNum3(s.quantity),
  low_stock_threshold: s.low_stock_threshold == null ? null : toNum3(s.low_stock_threshold),
  updated_at: toIso3(s.updated_at),
});

export type StockListParams = { q?: string; sku?: string; product_id?: string; variant_id?: string; low_only?: boolean; limit?: number; offset?: number; sort?: "updated_at" | "quantity" | "sku"; order?: "asc" | "desc" };
export type AdjustStockBody = { sku?: string; variant_id?: string; product_id?: string; delta: number; reason?: string };

export const stockAdminApi = baseApi3.injectEndpoints({
  endpoints: (b) => ({
    listStockAdmin: b.query<StockItem[], StockListParams | void>({
      query: (params) => ({ url: "/admin/stock", params }),
      transformResponse: (res: unknown): StockItem[] => Array.isArray(res) ? (res as ApiStockItem[]).map(normalizeStockItem) : [],
      providesTags: (result) => result ? [
        ...result.map((s) => ({ type: "StockItem" as const, id: s.id })),
        { type: "StockItems" as const, id: "LIST" },
      ] : [{ type: "StockItems" as const, id: "LIST" }],
    }),

    adjustStockAdmin: b.mutation<StockItem, AdjustStockBody>({
      query: (body) => ({ url: "/admin/stock/adjust", method: "POST", body }),
      transformResponse: (res: unknown): StockItem => normalizeStockItem(res as ApiStockItem),
      invalidatesTags: (res) => res ? [{ type: "StockItem" as const, id: res.id }, { type: "StockItems" as const, id: "LIST" }] : [{ type: "StockItems" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListStockAdminQuery,
  useAdjustStockAdminMutation,
} = stockAdminApi;