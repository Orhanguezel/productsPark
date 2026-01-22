// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payments_admin.endpoints.ts
// FINAL — Payments Admin RTK (types-driven, no local helpers)
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentRow,
  PaymentEventRow,
  PaymentsAdminListParams,
  CaptureBody,
  RefundBody,
  VoidBody,
} from '@/integrations/types';

import {
  normalizePaymentRow,
  normalizePaymentRows,
  normalizePaymentEvents,
  toPaymentsAdminListQuery,
  toCaptureBody,
  toRefundBody,
  toVoidBody,
} from '@/integrations/types';

const BASE = '/admin/payments';

export const paymentsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/payments
    listPaymentsAdmin: b.query<PaymentRow[], PaymentsAdminListParams | void>({
      query: (params) => {
        const qp = toPaymentsAdminListQuery(params);
        return qp ? { url: BASE, params: qp } : { url: BASE };
      },
      transformResponse: (res: unknown): PaymentRow[] => normalizePaymentRows(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'Payments' as const, id: p.id })),
              { type: 'Payments' as const, id: 'LIST' },
            ]
          : [{ type: 'Payments' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/payments/:id
    getPaymentAdminById: b.query<PaymentRow, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentRow => normalizePaymentRow(res),
      providesTags: (_r, _e, id) => [{ type: 'Payments' as const, id }],
    }),

    // POST /admin/payments/:id/capture
    capturePaymentAdmin: b.mutation<PaymentRow, { id: string; body?: CaptureBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/capture`,
        method: 'POST',
        ...(toCaptureBody(body) ? { body: toCaptureBody(body) } : {}),
      }),
      transformResponse: (res: unknown): PaymentRow => normalizePaymentRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payments' as const, id: arg.id },
        { type: 'Payments' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/payments/:id/refund
    refundPaymentAdmin: b.mutation<PaymentRow, { id: string; body?: RefundBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/refund`,
        method: 'POST',
        ...(toRefundBody(body) ? { body: toRefundBody(body) } : {}),
      }),
      transformResponse: (res: unknown): PaymentRow => normalizePaymentRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payments' as const, id: arg.id },
        { type: 'Payments' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/payments/:id/void
    voidPaymentAdmin: b.mutation<PaymentRow, { id: string; body?: VoidBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/void`,
        method: 'POST',
        ...(toVoidBody(body) ? { body: toVoidBody(body) } : {}),
      }),
      transformResponse: (res: unknown): PaymentRow => normalizePaymentRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payments' as const, id: arg.id },
        { type: 'Payments' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/payments/:id/sync
    syncPaymentAdmin: b.mutation<PaymentRow, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/sync`, method: 'POST' }),
      transformResponse: (res: unknown): PaymentRow => normalizePaymentRow(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Payments' as const, id },
        { type: 'Payments' as const, id: 'LIST' },
      ],
    }),

    // GET /admin/payments/:id/events
    listPaymentEventsAdmin: b.query<PaymentEventRow[], string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/events` }),
      transformResponse: (res: unknown): PaymentEventRow[] => normalizePaymentEvents(res),
      providesTags: (_r, _e, id) => [{ type: 'Payments' as const, id: `EVENTS_${id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentsAdminQuery,
  useGetPaymentAdminByIdQuery,
  useCapturePaymentAdminMutation,
  useRefundPaymentAdminMutation,
  useVoidPaymentAdminMutation,
  useSyncPaymentAdminMutation,
  useListPaymentEventsAdminQuery,
} = paymentsAdminApi;
