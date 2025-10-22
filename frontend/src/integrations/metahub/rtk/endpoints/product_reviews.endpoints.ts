
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/product_reviews.endpoints.ts
// =============================================================
import { baseApi as baseApi_m6 } from "../baseApi";

const toNumber_m6 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

type BoolLike6 = 0 | 1 | boolean;

export type ProductReview = {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number; // 1..5
  title?: string | null;
  content?: string | null;
  is_approved?: BoolLike6;
  created_at: string;
};

export type ApiProductReview = Omit<ProductReview, "rating"> & { rating: number | string };

const normalizeReview = (r: ApiProductReview): ProductReview => ({ ...r, rating: toNumber_m6(r.rating) });

export const productReviewsApi = baseApi_m6.injectEndpoints({
  endpoints: (b) => ({
    listProductReviews: b.query<ProductReview[], { product_id?: string; is_approved?: BoolLike6; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/product_reviews", params }),
      transformResponse: (res: unknown): ProductReview[] => Array.isArray(res) ? (res as ApiProductReview[]).map(normalizeReview) : [],
      providesTags: (result) => result
        ? [...result.map((i) => ({ type: "Reviews" as const, id: i.id })), { type: "Reviews" as const, id: "LIST" }]
        : [{ type: "Reviews" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListProductReviewsQuery } = productReviewsApi;