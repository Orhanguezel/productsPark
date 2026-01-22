// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/payment_providers_public.endpoints.ts
// FINAL — Payment Providers (PUBLIC) RTK
// GET /payment_providers
// GET /payment_providers/:key
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentProviderPublic,
  PaymentProvidersPublicListParams
} from '@/integrations/types';

import {
  normalizePaymentProviderPublic,
  normalizePaymentProviderPublicList,
  toPaymentProvidersListQuery,
} from '@/integrations/types';

const BASE = '/payment_providers';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentProvider', 'PaymentProviders'] as const,
});

export const paymentProvidersPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProviders: b.query<PaymentProviderPublic[], PaymentProvidersPublicListParams | void>(
      {
        query: (params) => {
          const qp = params ? toPaymentProvidersListQuery(params) : undefined;
          return { url: BASE, ...(qp ? { params: qp } : {}) };
        },
        transformResponse: (res: unknown): PaymentProviderPublic[] =>
          normalizePaymentProviderPublicList(res),
        providesTags: (result) =>
          result?.length
            ? [
                ...result.map((p) => ({ type: 'PaymentProvider' as const, id: p.id })),
                { type: 'PaymentProviders' as const, id: 'LIST' },
              ]
            : [{ type: 'PaymentProviders' as const, id: 'LIST' }],
        keepUnusedDataFor: 60,
      },
    ),

    getPaymentProviderByKey: b.query<PaymentProviderPublic, string>({
      query: (key) => ({ url: `${BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): PaymentProviderPublic =>
        normalizePaymentProviderPublic(res),
      providesTags: (_r, _e, key) => [{ type: 'PaymentProvider' as const, id: `KEY:${key}` }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListPaymentProvidersQuery, useGetPaymentProviderByKeyQuery } =
  paymentProvidersPublicApi;
