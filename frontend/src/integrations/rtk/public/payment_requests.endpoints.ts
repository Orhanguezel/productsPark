// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/payment_requests.endpoints.ts
// FINAL — Payment Requests (AUTH REQUIRED) RTK
// Backend: /payment_requests routes are auth-protected and user-scoped.
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentRequestRow as PaymentRequest,
  PaymentRequestsListParams,
  CreatePaymentRequestBody,
  DeletePaymentRequestResp,
} from '@/integrations/types';

import {
  normalizePaymentRequestRow,
  normalizePaymentRequestRows,
  toPaymentRequestsListQuery,
  normalizeDeletePaymentRequestResp,
} from '@/integrations/types';

const BASE = '/payment_requests';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentRequest', 'PaymentRequests'] as const,
});

export const paymentRequestsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /payment_requests (auth)
    listPaymentRequests: b.query<PaymentRequest[], PaymentRequestsListParams | void>({
      query: (params) => {
        const qp = params ? toPaymentRequestsListQuery(params) : undefined;
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): PaymentRequest[] => normalizePaymentRequestRows(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((r) => ({ type: 'PaymentRequest' as const, id: r.id })),
              { type: 'PaymentRequests' as const, id: 'USER_LIST' },
            ]
          : [{ type: 'PaymentRequests' as const, id: 'USER_LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /payment_requests/:id (auth)
    getPaymentRequestById: b.query<PaymentRequest, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentRequest => normalizePaymentRequestRow(res),
      providesTags: (_r, _e, id) => [{ type: 'PaymentRequest' as const, id }],
      keepUnusedDataFor: 60,
    }),

    // POST /payment_requests (auth)
    createPaymentRequest: b.mutation<PaymentRequest, CreatePaymentRequestBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): PaymentRequest => normalizePaymentRequestRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PaymentRequests' as const, id: 'USER_LIST' },
        { type: 'PaymentRequests' as const, id: `ORDER_${arg.order_id}` },
      ],
    }),

    // DELETE /payment_requests/:id (auth)
    deletePaymentRequest: b.mutation<DeletePaymentRequestResp, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): DeletePaymentRequestResp =>
        normalizeDeletePaymentRequestResp(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PaymentRequest' as const, id },
        { type: 'PaymentRequests' as const, id: 'USER_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentRequestsQuery,
  useGetPaymentRequestByIdQuery,
  useCreatePaymentRequestMutation,
  useDeletePaymentRequestMutation,
} = paymentRequestsApi;
