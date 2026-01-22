// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_sessions_admin.endpoints.ts
// FINAL — Payment Sessions (ADMIN) RTK
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentSessionRow as PaymentSessionAdmin,
  PaymentSessionStatus,
  PaymentSessionsListParams as ListSessionsParams,
  CreatePaymentSessionAdminBody as CreateSessionBody,
  PaymentSessionActionResp,
} from '@/integrations/types';

import {
  normalizePaymentSessionRow,
  normalizePaymentSessionRows,
  toPaymentSessionsListQuery,
  normalizePaymentSessionActionResp,
} from '@/integrations/types';

const BASE = '/admin/payment_sessions';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentSession', 'PaymentSessions'] as const,
});

export const paymentSessionsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentSessionsAdmin: b.query<PaymentSessionAdmin[], ListSessionsParams | void>({
      query: (params) => {
        const qp = params ? toPaymentSessionsListQuery(params) : undefined;
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): PaymentSessionAdmin[] => normalizePaymentSessionRows(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'PaymentSession' as const, id: p.id })),
              { type: 'PaymentSessions' as const, id: 'ADMIN_LIST' },
            ]
          : [{ type: 'PaymentSessions' as const, id: 'ADMIN_LIST' }],
      keepUnusedDataFor: 60,
    }),

    getPaymentSessionAdminById: b.query<PaymentSessionAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentSessionAdmin => normalizePaymentSessionRow(res),
      providesTags: (_r, _e, id) => [{ type: 'PaymentSession', id }],
      keepUnusedDataFor: 60,
    }),

    createPaymentSessionAdmin: b.mutation<PaymentSessionAdmin, CreateSessionBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): PaymentSessionAdmin => normalizePaymentSessionRow(res),
      invalidatesTags: [{ type: 'PaymentSessions', id: 'ADMIN_LIST' }],
    }),

    capturePaymentSessionAdmin: b.mutation<PaymentSessionActionResp, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/capture`,
        method: 'POST',
      }),
      transformResponse: (res: unknown): PaymentSessionActionResp =>
        normalizePaymentSessionActionResp(res),
      invalidatesTags: (_r, _e, a) => [
        { type: 'PaymentSession', id: a.id },
        { type: 'PaymentSessions', id: 'ADMIN_LIST' },
      ],
    }),

    cancelPaymentSessionAdmin: b.mutation<PaymentSessionActionResp, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
      }),
      transformResponse: (res: unknown): PaymentSessionActionResp =>
        normalizePaymentSessionActionResp(res),
      invalidatesTags: (_r, _e, a) => [
        { type: 'PaymentSession', id: a.id },
        { type: 'PaymentSessions', id: 'ADMIN_LIST' },
      ],
    }),

    syncPaymentSessionAdmin: b.mutation<PaymentSessionActionResp, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/sync`,
        method: 'POST',
      }),
      transformResponse: (res: unknown): PaymentSessionActionResp =>
        normalizePaymentSessionActionResp(res),
      invalidatesTags: (_r, _e, a) => [
        { type: 'PaymentSession', id: a.id },
        { type: 'PaymentSessions', id: 'ADMIN_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentSessionsAdminQuery,
  useGetPaymentSessionAdminByIdQuery,
  useCreatePaymentSessionAdminMutation,
  useCapturePaymentSessionAdminMutation,
  useCancelPaymentSessionAdminMutation,
  useSyncPaymentSessionAdminMutation,
} = paymentSessionsAdminApi;
