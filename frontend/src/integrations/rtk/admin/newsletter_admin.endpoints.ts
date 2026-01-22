// ===================================================================
// FILE: src/integrations/rtk/admin/newsletter_admin.endpoints.ts
// FINAL — Newsletter Admin RTK (Single Language)
// - no any
// - exactOptionalPropertyTypes friendly
// - total from x-total-count if meta exposes headers
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  NewsletterAdminListParams,
  NewsletterAdminListResp,
  NewsletterAdminSubscriber,
  NewsletterAdminUpdateBody,
  HeadersLike,
} from '@/integrations/types';

import {
  normalizeNewsletterAdminList,
  normalizeNewsletterAdminSubscriber,
  toNewsletterAdminListQuery,
  toNewsletterAdminUpdateBody,
  readTotalFromHeaders,
} from '@/integrations/types';

const BASE = '/admin/newsletter';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['NewsletterSubscribers', 'NewsletterSubscriber'] as const,
});

type BaseQueryMeta = {
  response?: { headers?: HeadersLike } | { headers?: HeadersLike };
  headers?: HeadersLike;
  meta?: { response?: { headers?: HeadersLike } };
};

function pickHeaders(meta: unknown): HeadersLike {
  const m = (meta && typeof meta === 'object' ? (meta as BaseQueryMeta) : {}) as BaseQueryMeta;

  // common patterns across baseQuery wrappers
  const h1 = (m.response as { headers?: HeadersLike } | undefined)?.headers;
  const h2 = m.headers;
  const h3 = m.meta?.response?.headers;

  return h1 ?? h2 ?? h3;
}

export const newsletterAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/newsletter
    listNewsletterAdmin: b.query<NewsletterAdminListResp, NewsletterAdminListParams | void>({
      query: (params) => {
        const qp = params ? toNewsletterAdminListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (
        res: unknown,
        meta: unknown,
        arg: NewsletterAdminListParams | void,
      ): NewsletterAdminListResp => {
        const data = normalizeNewsletterAdminList(res);

        const headers = pickHeaders(meta);
        const total = readTotalFromHeaders(headers);

        const p = (arg ?? {}) as NewsletterAdminListParams;

        return {
          data,
          meta: {
            total,
            limit: typeof p.limit === 'number' ? p.limit : null,
            offset: typeof p.offset === 'number' ? p.offset : null,
          },
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((x) => ({ type: 'NewsletterSubscriber' as const, id: x.id })),
              { type: 'NewsletterSubscribers' as const, id: 'LIST' },
            ]
          : [{ type: 'NewsletterSubscribers' as const, id: 'LIST' }],
    }),

    // GET /admin/newsletter/:id
    getNewsletterAdminById: b.query<NewsletterAdminSubscriber, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): NewsletterAdminSubscriber =>
        normalizeNewsletterAdminSubscriber(res),
      providesTags: (_r, _e, id) => [{ type: 'NewsletterSubscriber' as const, id }],
    }),

    // PATCH /admin/newsletter/:id
    updateNewsletterAdmin: b.mutation<
      NewsletterAdminSubscriber,
      { id: string; body: NewsletterAdminUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toNewsletterAdminUpdateBody(body),
      }),
      transformResponse: (res: unknown): NewsletterAdminSubscriber =>
        normalizeNewsletterAdminSubscriber(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'NewsletterSubscriber' as const, id: arg.id },
        { type: 'NewsletterSubscribers' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/newsletter/:id (204)
    removeNewsletterAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'NewsletterSubscriber' as const, id },
        { type: 'NewsletterSubscribers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNewsletterAdminQuery,
  useGetNewsletterAdminByIdQuery,
  useUpdateNewsletterAdminMutation,
  useRemoveNewsletterAdminMutation,
} = newsletterAdminApi;
