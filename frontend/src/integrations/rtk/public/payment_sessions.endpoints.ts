// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/payment_sessions.endpoints.ts
// FINAL — Payment Sessions (PUBLIC) RTK
// Backend public routes:
// - POST /payment_sessions
// - GET  /payment_sessions/:id
// NOTE: NO public capture/cancel.
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentSessionRow as PaymentSession,
  CreatePaymentSessionBody,
} from '@/integrations/types';

import { normalizePaymentSessionRow } from '@/integrations/types';

const BASE = '/payment_sessions';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentSession', 'PaymentSessions'] as const,
});

export const paymentSessionsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // POST /payment_sessions
    createPaymentSession: b.mutation<PaymentSession, CreatePaymentSessionBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): PaymentSession => normalizePaymentSessionRow(res),
      invalidatesTags: [{ type: 'PaymentSessions' as const, id: 'PUBLIC_LIST' }],
    }),

    // GET /payment_sessions/:id
    getPaymentSessionById: b.query<PaymentSession, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentSession => normalizePaymentSessionRow(res),
      providesTags: (_r, _e, id) => [{ type: 'PaymentSession' as const, id }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useCreatePaymentSessionMutation, useGetPaymentSessionByIdQuery } =
  paymentSessionsApi;
