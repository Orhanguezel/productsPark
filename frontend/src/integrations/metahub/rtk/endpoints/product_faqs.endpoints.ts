// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_faqs.endpoints.ts
// (Public product FAQs)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ProductFaqRow } from "@/integrations/metahub/rtk/types/products";

type ListFaqsParams = {
  product_id?: string;
  only_active?: boolean | 0 | 1;
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

export const productFaqsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductFaqs: b.query<ProductFaqRow[], ListFaqsParams | void>({
      query: (params): FetchArgs => {
        const qp: Record<string, string | number> = {};
        if (params && (params as ListFaqsParams).product_id) {
          qp.product_id = (params as ListFaqsParams).product_id as string;
        }
        if (params && (params as ListFaqsParams).only_active !== undefined) {
          const onlyActive = (params as ListFaqsParams).only_active;
          qp.only_active = onlyActive ? 1 : 0;
        }
        return { url: "/products/faqs", params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): ProductFaqRow[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "faqs"]);
        return rows.filter(isRecord).map((x) => x as ProductFaqRow);
      },
      // admin tarafında replaceFaqsAdmin -> ProductFAQs tag'i invalid ediyor
      providesTags: (_result, _e, arg) => {
        const params = (arg || {}) as ListFaqsParams;
        return params.product_id
          ? [{ type: "ProductFAQs" as const, id: params.product_id }]
          : [{ type: "ProductFAQs" as const, id: "LIST" }];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductFaqsQuery } = productFaqsApi;
