// ===================================================================
// FILE: src/integrations/rtk/public/newsletter_public.endpoints.ts
// FINAL — Newsletter Public RTK (Single Language)
// - no any
// - exactOptionalPropertyTypes friendly
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  NewsletterPublicSubscribeBody,
  NewsletterPublicUnsubscribeBody,
  NewsletterPublicSubscriber,
  NewsletterUnsubscribeResp,
} from '@/integrations/types';

import {
  normalizeNewsletterPublicSubscriber,
  normalizeNewsletterUnsubscribeResp,
  toNewsletterSubscribeBody,
  toNewsletterUnsubscribeBody,
} from '@/integrations/types';

const BASE = '/newsletter';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Newsletter'] as const });

export const newsletterPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // POST /newsletter/subscribe
    subscribeNewsletter: b.mutation<NewsletterPublicSubscriber, NewsletterPublicSubscribeBody>({
      query: (body) => ({
        url: `${BASE}/subscribe`,
        method: 'POST',
        body: toNewsletterSubscribeBody(body),
      }),
      transformResponse: (res: unknown): NewsletterPublicSubscriber =>
        normalizeNewsletterPublicSubscriber(res),
      invalidatesTags: [{ type: 'Newsletter' as const, id: 'ME' }],
    }),

    // POST /newsletter/unsubscribe
    unsubscribeNewsletter: b.mutation<NewsletterUnsubscribeResp, NewsletterPublicUnsubscribeBody>({
      query: (body) => ({
        url: `${BASE}/unsubscribe`,
        method: 'POST',
        body: toNewsletterUnsubscribeBody(body),
      }),
      transformResponse: (res: unknown): NewsletterUnsubscribeResp =>
        normalizeNewsletterUnsubscribeResp(res),
      invalidatesTags: [{ type: 'Newsletter' as const, id: 'ME' }],
    }),
  }),
  overrideExisting: true,
});

export const { useSubscribeNewsletterMutation, useUnsubscribeNewsletterMutation } =
  newsletterPublicApi;
