// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/faqs_public.endpoints.ts
// FINAL — Public FAQs RTK (central types + query helper)
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { Faq, FaqListParams } from '@/integrations/types';
import { toFaqsPublicQuery } from '@/integrations/types';

const BASE = '/faqs';

export const faqsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /faqs
    listFaqs: b.query<Faq[], FaqListParams | void>({
      query: (p) => ({ url: BASE, params: toFaqsPublicQuery(p) }),
      providesTags: (res) =>
        res?.length
          ? [
              { type: 'Faqs' as const, id: 'LIST' },
              ...res.map((r) => ({ type: 'Faqs' as const, id: r.id })),
            ]
          : [{ type: 'Faqs' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /faqs/:id
    getFaqById: b.query<Faq, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      providesTags: (_res, _e, id) => [{ type: 'Faqs' as const, id }],
    }),

    // GET /faqs/by-slug/:slug
    getFaqBySlug: b.query<Faq, string>({
      query: (slug) => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}` }),
      providesTags: (_res, _e, slug) => [{ type: 'Faqs' as const, id: `SLUG_${slug}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListFaqsQuery, useGetFaqByIdQuery, useGetFaqBySlugQuery } = faqsPublicApi;
