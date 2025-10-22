
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/product_stock.endpoints.ts
// =============================================================
import { baseApi as baseApi_m8 } from "../baseApi";

const toNumber_m8 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

type BoolLike8 = 0 | 1 | boolean;

export type ProductStock = {
  id: string;
  product_id: string;
  sku?: string | null;
  track_stock?: BoolLike8;
  qty?: number | null;
  in_stock?: BoolLike8;
  updated_at?: string;
};

export type ApiProductStock = Omit<ProductStock, "qty"> & { qty?: number | string | null };

const normalizeStock = (s: ApiProductStock): ProductStock => ({ ...s, qty: s.qty == null ? null : toNumber_m8(s.qty) });

export const productStockApi = baseApi_m8.injectEndpoints({
  endpoints: (b) => ({
    getProductStockByProductId: b.query<ProductStock, string>({
      query: (product_id) => ({ url: `/product_stock/by-product/${product_id}` }),
      transformResponse: (res: unknown): ProductStock => normalizeStock(res as ApiProductStock),
      providesTags: (_r, _e, product_id) => [{ type: "Stock", id: product_id }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetProductStockByProductIdQuery } = productStockApi;
