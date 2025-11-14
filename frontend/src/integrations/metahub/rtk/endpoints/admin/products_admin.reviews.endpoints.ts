// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.reviews.endpoints.ts
// REVIEWS: CRUD + toggle + replace
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  Review,
  ReviewInput,
} from "@/integrations/metahub/db/types/products";

const BASE = "/admin/products";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const pluckArray = (res: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const toBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true";
};

type ListProductReviewsParams = {
  id: string;
  only_active?: boolean | 0 | 1;
  order?: "asc" | "desc";
};

export const productReviewsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/reviews
    listProductReviewsAdmin: b.query<Review[], ListProductReviewsParams>({
      query: ({ id, only_active, order }): FetchArgs => {
        const params: Record<string, string | number> = {};
        if (only_active !== undefined) {
          params.only_active = toBool(only_active) ? 1 : 0;
        }
        if (order) params.order = order;
        return {
          url: `${BASE}/${encodeURIComponent(id)}/reviews`,
          params,
        } as FetchArgs;
      },
      transformResponse: (res: unknown): Review[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "reviews"]);
        return rows.filter(isRecord).map((x) => x as unknown as Review);
      },
      providesTags: (_result, _error, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
      ],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/reviews
    createProductReviewAdmin: b.mutation<
      Review,
      { id: string; body: ReviewInput }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Review => res as Review,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
        { type: "Product" as const, id: arg.id }, // rating / review_count güncelleniyor
      ],
    }),

    // PATCH /admin/products/:id/reviews/:reviewId
    updateProductReviewAdmin: b.mutation<
      Review,
      { id: string; reviewId: string; body: Partial<ReviewInput> }
    >({
      query: ({ id, reviewId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews/${encodeURIComponent(
          reviewId
        )}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): Review => res as Review,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
        { type: "Product" as const, id: arg.id },
      ],
    }),

    // PATCH /admin/products/:id/reviews/:reviewId/active
    toggleProductReviewActiveAdmin: b.mutation<
      Review,
      { id: string; reviewId: string; is_active: boolean }
    >({
      query: ({ id, reviewId, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/reviews/${encodeURIComponent(reviewId)}/active`,
        method: "PATCH",
        body: { is_active },
      }),
      transformResponse: (res: unknown): Review => res as Review,
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
        { type: "Product" as const, id: arg.id },
      ],
    }),

    // DELETE /admin/products/:id/reviews/:reviewId
    deleteProductReviewAdmin: b.mutation<
      { ok: true },
      { id: string; reviewId: string }
    >({
      query: ({ id, reviewId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(
          id
        )}/reviews/${encodeURIComponent(reviewId)}`,
        method: "DELETE",
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
        { type: "Product" as const, id: arg.id },
      ],
    }),

    // PUT /admin/products/:id/reviews  (replace – eski FE ile backward compatible)
    replaceReviewsAdmin: b.mutation<
      { ok: true },
      { id: string; reviews: Array<ReviewInput | Review> }
    >({
      query: ({ id, reviews }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews`,
        method: "PUT",
        body: { reviews },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ProductReviews" as const, id: arg.id },
        { type: "Product" as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductReviewsAdminQuery,
  useCreateProductReviewAdminMutation,
  useUpdateProductReviewAdminMutation,
  useToggleProductReviewActiveAdminMutation,
  useDeleteProductReviewAdminMutation,
  useReplaceReviewsAdminMutation,
} = productReviewsAdminApi;
