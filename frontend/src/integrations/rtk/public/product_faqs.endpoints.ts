// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/product_faqs.endpoints.ts
// FINAL — Public Product FAQs RTK
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { ProductFaq, PublicListProductFaqsParams } from '@/integrations/types/products_faqs';
import {
  normalizeProductFaqs,
  toPublicListProductFaqsQuery,
} from '@/integrations/types/products_faqs';

export const productFaqsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /products/faqs?product_id=&only_active=
    listProductFaqs: b.query<ProductFaq[], PublicListProductFaqsParams | void>({
      query: (params): FetchArgs => {
        const qp = toPublicListProductFaqsQuery(params);
        return { url: '/products/faqs', method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): ProductFaq[] => normalizeProductFaqs(res),
      providesTags: (_r, _e, arg) => {
        const p = (arg ?? {}) as PublicListProductFaqsParams;
        return p.product_id
          ? [{ type: 'ProductFAQs' as const, id: p.product_id }]
          : [{ type: 'ProductFAQs' as const, id: 'LIST' }];
      },
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListProductFaqsQuery } = productFaqsApi;
