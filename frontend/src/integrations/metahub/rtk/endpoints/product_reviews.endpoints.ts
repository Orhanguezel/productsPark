// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_reviews.endpoints.ts
// (Public product reviews)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ProductReviewRow,
  ReviewInput,
} from "@/integrations/metahub/db/types/products";

type ListReviewsParams = {
  product_id?: string;
  only_active?: boolean | 0 | 1;
};

type CreateReviewBody = Omit<ReviewInput, "id"> & {
  product_id: string;
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

export const productReviewsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductReviews: b.query<ProductReviewRow[], ListReviewsParams | void>({
      query: (params): FetchArgs => {
        const qp: Record<string, string | number> = {};
        if (params && (params as ListReviewsParams).product_id) {
          qp.product_id = (params as ListReviewsParams).product_id as string;
        }
        if (params && (params as ListReviewsParams).only_active !== undefined) {
          const onlyActive = (params as ListReviewsParams).only_active;
          qp.only_active = onlyActive ? 1 : 0;
        }
        return { url: "/products/reviews", params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): ProductReviewRow[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "reviews"]);
        return rows.filter(isRecord).map((x) => x as ProductReviewRow);
      },
      // admin replaceReviewsAdmin -> ProductReviews tag'i invalid ediyor
      providesTags: (_result, _e, arg) => {
        const params = (arg || {}) as ListReviewsParams;
        return params.product_id
          ? [{ type: "ProductReviews" as const, id: params.product_id }]
          : [{ type: "ProductReviews" as const, id: "LIST" }];
      },
      keepUnusedDataFor: 60,
    }),

    createProductReview: b.mutation<ProductReviewRow, CreateReviewBody>({
      query: (body): FetchArgs => ({
        url: "/products/reviews",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): ProductReviewRow =>
        res as ProductReviewRow,
      invalidatesTags: (_r, _e, body) => [
        { type: "ProductReviews" as const, id: body.product_id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductReviewsQuery,
  useCreateProductReviewMutation,
} = productReviewsApi;
