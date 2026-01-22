// =============================================================
// FILE: src/integrations/rtk/admin/reviews_admin.endpoints.ts
// FINAL — Admin Reviews RTK (central types + helpers)
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ReviewView,
  ReviewListParams,
  ReviewCreateInput,
  ReviewUpdateInput,
} from '@/integrations/types';

import {
  normalizeReview,
  normalizeReviewList,
  toReviewsQuery,
  toReviewCreateApiBody,
  toReviewUpdateApiBody,
} from '@/integrations/types';

const BASE = '/admin/reviews';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Review'] as const });

export const reviewsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/reviews
    listReviewsAdmin: b.query<ReviewView[], ReviewListParams | void>({
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

    // GET /admin/reviews/:id
    getReviewAdminById: b.query<ReviewView, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): ReviewView => normalizeReview(res),
      providesTags: (_res, _err, id) => [{ type: 'Review' as const, id }],
    }),

    // POST /admin/reviews
    createReviewAdmin: b.mutation<ReviewView, ReviewCreateInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toReviewCreateApiBody(body),
      }),
      transformResponse: (res: unknown): ReviewView => normalizeReview(res),
      invalidatesTags: [{ type: 'Review' as const, id: 'LIST' }],
    }),

    // PATCH /admin/reviews/:id
    updateReviewAdmin: b.mutation<ReviewView, { id: string; body: ReviewUpdateInput }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toReviewUpdateApiBody(body),
      }),
      transformResponse: (res: unknown): ReviewView => normalizeReview(res),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Review' as const, id: arg.id },
        { type: 'Review' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/reviews/:id
    deleteReviewAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_res, _e, id) => [
        { type: 'Review' as const, id },
        { type: 'Review' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListReviewsAdminQuery,
  useGetReviewAdminByIdQuery,
  useCreateReviewAdminMutation,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} = reviewsAdminApi;
