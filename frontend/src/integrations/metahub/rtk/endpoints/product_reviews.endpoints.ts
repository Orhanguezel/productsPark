// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/product_reviews.endpoints.ts
// =============================================================
import { baseApi as baseApi_m6 } from "../baseApi";

const toNumber_m6 = (x: unknown): number =>
  typeof x === "number" ? x : Number(x as unknown);

type BoolLike6 = 0 | 1 | boolean;

export type ProductReview = {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number;                // 1..5
  comment?: string | null;
  is_active?: BoolLike6;
  customer_name?: string | null;
  review_date: string;
  created_at: string;
  updated_at?: string;
};

export type ApiProductReview = Omit<ProductReview, "rating"> & {
  rating: number | string;
};

const normalizeReview = (r: ApiProductReview): ProductReview => ({
  ...r,
  rating: toNumber_m6(r.rating),
});

export const productReviewsApi = baseApi_m6.injectEndpoints({
  endpoints: (b) => ({
    listProductReviews: b.query<
      ProductReview[],
      { product_id?: string; only_active?: BoolLike6; limit?: number; offset?: number }
    >({
      query: (params) => {
        const { product_id, only_active = 1, limit, offset } = params ?? {};
        return {
          url: "/product_reviews",
          params: {
            product_id,
            only_active: only_active ? 1 : 0,
            limit,
            offset,
          },
        };
      },
      transformResponse: (res: unknown): ProductReview[] =>
        Array.isArray(res)
          ? (res as ApiProductReview[]).map(normalizeReview)
          : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "Reviews" as const, id: i.id })),
              { type: "Reviews" as const, id: "LIST" },
            ]
          : [{ type: "Reviews" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListProductReviewsQuery } = productReviewsApi;
