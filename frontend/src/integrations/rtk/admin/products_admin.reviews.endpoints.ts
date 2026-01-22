// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.reviews.endpoints.ts
// FINAL — Admin Product Reviews RTK (CRUD + toggle + replace)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ProductReview,
  ProductReviewInput,
  AdminListProductReviewsParams,
} from '@/integrations/types';
import {
  normalizeProductReview,
  normalizeProductReviews,
  toAdminListProductReviewsQuery,
  toReviewInputBody,
  toReplaceReviewsBody,
} from '@/integrations/types';

const BASE = '/admin/products';

export const productReviewsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/products/:id/reviews
    listProductReviewsAdmin: b.query<ProductReview[], AdminListProductReviewsParams>({
      query: ({ id, ...rest }): FetchArgs => {
        const qp = toAdminListProductReviewsQuery({ id, ...rest });
        return {
          url: `${BASE}/${encodeURIComponent(id)}/reviews`,
          method: 'GET',
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): ProductReview[] => normalizeProductReviews(res),
      providesTags: (_r, _e, arg) => [{ type: 'ProductReviews' as const, id: arg.id }],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/products/:id/reviews
    createProductReviewAdmin: b.mutation<ProductReview, { id: string; body: ProductReviewInput }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews`,
        method: 'POST',
        body: toReviewInputBody(body),
      }),
      transformResponse: (res: unknown): ProductReview => normalizeProductReview(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductReviews' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id }, // rating/review_count güncelleniyor
      ],
    }),

    // PATCH /admin/products/:id/reviews/:reviewId
    updateProductReviewAdmin: b.mutation<
      ProductReview,
      { id: string; reviewId: string; body: Partial<ProductReviewInput> }
    >({
      query: ({ id, reviewId, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}`,
        method: 'PATCH',
        body: toReviewInputBody(body),
      }),
      transformResponse: (res: unknown): ProductReview => normalizeProductReview(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductReviews' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id },
      ],
    }),

    // PATCH /admin/products/:id/reviews/:reviewId/active
    toggleProductReviewActiveAdmin: b.mutation<
      ProductReview,
      { id: string; reviewId: string; is_active: boolean }
    >({
      query: ({ id, reviewId, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}/active`,
        method: 'PATCH',
        body: { is_active: is_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): ProductReview => normalizeProductReview(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductReviews' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id },
      ],
    }),

    // DELETE /admin/products/:id/reviews/:reviewId
    deleteProductReviewAdmin: b.mutation<{ ok: true }, { id: string; reviewId: string }>({
      query: ({ id, reviewId }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductReviews' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id },
      ],
    }),

    // PUT /admin/products/:id/reviews (replace – legacy/backward compatible)
    replaceReviewsAdmin: b.mutation<
      { ok: true },
      { id: string; reviews: Array<ProductReviewInput | ProductReview> }
    >({
      query: ({ id, reviews }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/reviews`,
        method: 'PUT',
        body: toReplaceReviewsBody(reviews),
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'ProductReviews' as const, id: arg.id },
        { type: 'Product' as const, id: arg.id },
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
