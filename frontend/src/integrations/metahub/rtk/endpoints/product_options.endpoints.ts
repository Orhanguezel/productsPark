// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_options.endpoints.ts
// (Public product options)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ProductOption } from "@/integrations/metahub/db/types/products";

type ListOptionsParams = {
  product_id?: string;
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

export const productOptionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductOptions: b.query<ProductOption[], ListOptionsParams | void>({
      query: (params): FetchArgs => {
        const qp: Record<string, string> = {};
        if (params && (params as ListOptionsParams).product_id) {
          qp.product_id = (params as ListOptionsParams).product_id as string;
        }
        return { url: "/products/options", params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): ProductOption[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "options"]);
        return rows.filter(isRecord).map((x) => x as ProductOption);
      },
      // İstersek Product tag'ine bağlayabiliriz, stock/options admin güncellemesinde invalidate olsun diye
      providesTags: (_result, _e, arg) => {
        const params = (arg || {}) as ListOptionsParams;
        return params.product_id
          ? [{ type: "Product" as const, id: params.product_id }]
          : [];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductOptionsQuery } = productOptionsApi;
