// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_reviews.endpoints.ts
// FINAL — Public Product Reviews RTK (list + create)
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  ProductReview,
  CreateProductReviewBody,
  PublicListProductReviewsParams,
} from '@/integrations/types';
import {
  normalizeProductReview,
  normalizeProductReviews,
  toPublicListProductReviewsQuery,
  toCreateReviewBody,
} from '@/integrations/types';

export const productReviewsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /products/reviews?product_id=&only_active=
    listProductReviews: b.query<ProductReview[], PublicListProductReviewsParams | void>({
      query: (params): FetchArgs => {
        const qp = toPublicListProductReviewsQuery(params);
        return { url: '/products/reviews', method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): ProductReview[] => normalizeProductReviews(res),
      providesTags: (_r, _e, arg) => {
        const p = (arg ?? {}) as PublicListProductReviewsParams;
        return p.product_id
          ? [{ type: 'ProductReviews' as const, id: p.product_id }]
          : [{ type: 'ProductReviews' as const, id: 'LIST' }];
      },
      keepUnusedDataFor: 60,
    }),

    // POST /products/reviews
    createProductReview: b.mutation<ProductReview, CreateProductReviewBody>({
      query: (body): FetchArgs => ({
        url: '/products/reviews',
        method: 'POST',
        body: toCreateReviewBody(body),
      }),
      transformResponse: (res: unknown): ProductReview => normalizeProductReview(res),
      invalidatesTags: (_r, _e, body) => [
        { type: 'ProductReviews' as const, id: body.product_id },
        { type: 'Products' as const, id: 'PUBLIC_LIST' }, // opsiyonel: listelerde rating görünüyorsa
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useListProductReviewsQuery, useCreateProductReviewMutation } = productReviewsApi;
