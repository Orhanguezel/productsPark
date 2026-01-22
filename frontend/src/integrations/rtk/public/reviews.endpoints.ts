// =============================================================
// FILE: src/integrations/rtk/public/reviews.endpoints.ts
// FINAL — Public Reviews RTK (central types + helpers)
// - TARGET aware filters supported
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { ReviewView, ReviewListParams, ReviewCreateInput } from '@/integrations/types';

import {
  normalizeReview,
  normalizeReviewList,
  toReviewsQuery,
  toReviewCreateApiBody,
} from '@/integrations/types';

const BASE = '/reviews';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Review'] as const });

export const reviewsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /reviews
    listReviews: b.query<ReviewView[], ReviewListParams | void>({
      query: (p) => {
        const qp = toReviewsQuery(p);
        return {
          url: BASE,
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): ReviewView[] => normalizeReviewList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((r) => ({ type: 'Review' as const, id: r.id })),
              { type: 'Review' as const, id: 'LIST' },
            ]
          : [{ type: 'Review' as const, id: 'LIST' }],
    }),

    // GET /reviews/:id
    getReviewById: b.query<ReviewView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): ReviewView => normalizeReview(res),
      providesTags: (_res, _err, id) => [{ type: 'Review' as const, id }],
    }),

    // POST /reviews
    createReview: b.mutation<ReviewView, ReviewCreateInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toReviewCreateApiBody(body),
      }),
      transformResponse: (res: unknown): ReviewView => normalizeReview(res),
      invalidatesTags: [{ type: 'Review' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListReviewsQuery, useGetReviewByIdQuery, useCreateReviewMutation } = reviewsApi;
