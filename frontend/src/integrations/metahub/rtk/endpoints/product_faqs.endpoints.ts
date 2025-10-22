
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/product_faqs.endpoints.ts
// =============================================================
import { baseApi as baseApi_m7 } from "../baseApi";

type BoolLike7 = 0 | 1 | boolean;

export type ProductFaq = {
  id: string;
  product_id: string;
  question: string;
  answer?: string | null;
  is_published?: BoolLike7;
  created_at?: string;
};

export const productFaqsApi = baseApi_m7.injectEndpoints({
  endpoints: (b) => ({
    listProductFaqs: b.query<ProductFaq[], { product_id?: string; is_published?: BoolLike7 }>({
      query: (params) => ({ url: "/product_faqs", params }),
      transformResponse: (res: unknown): ProductFaq[] => Array.isArray(res) ? (res as ProductFaq[]) : [],
      providesTags: (result) => result
        ? [...result.map((i) => ({ type: "Faqs" as const, id: i.id })), { type: "Faqs" as const, id: "LIST" }]
        : [{ type: "Faqs" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListProductFaqsQuery } = productFaqsApi;
