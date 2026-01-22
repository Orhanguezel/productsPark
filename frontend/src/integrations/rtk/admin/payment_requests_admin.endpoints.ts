// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_requests_admin.endpoints.ts
// FINAL — Payment Requests (ADMIN) RTK
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type {
  PaymentRequestRow as PaymentRequestAdmin,
  PaymentRequestsListParams as ListAdminParams,
  UpdatePaymentRequestAdminBody,
  SetPaymentRequestStatusAdminBody,
  DeletePaymentRequestResp,
} from '@/integrations/types';

import {
  normalizePaymentRequestRow,
  normalizePaymentRequestRows,
  toPaymentRequestsListQuery,
  toUpdatePaymentRequestAdminBody,
  toSetPaymentRequestStatusAdminBody,
  normalizeDeletePaymentRequestResp,
} from '@/integrations/types';

const BASE = '/admin/payment_requests';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['PaymentRequest', 'PaymentRequests'] as const,
});

export const paymentRequestsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentRequestsAdmin: b.query<PaymentRequestAdmin[], ListAdminParams | void>({
      query: (params) => {
        const qp = params ? toPaymentRequestsListQuery(params) : undefined;
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): PaymentRequestAdmin[] => normalizePaymentRequestRows(res),
      providesTags: (result, _e, args) => {
        const tags: Array<{ type: 'PaymentRequest' | 'PaymentRequests'; id: string }> = [
          { type: 'PaymentRequests', id: 'ADMIN_LIST' },
        ];

        if (args?.user_id) tags.push({ type: 'PaymentRequests', id: `ADMIN_USER_${args.user_id}` });
        if (args?.order_id)
          tags.push({ type: 'PaymentRequests', id: `ADMIN_ORDER_${args.order_id}` });

        if (result?.length) {
          for (const r of result) tags.push({ type: 'PaymentRequest', id: r.id });
        }

        return tags;
      },
      keepUnusedDataFor: 60,
    }),

    getPaymentRequestAdminById: b.query<PaymentRequestAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): PaymentRequestAdmin => normalizePaymentRequestRow(res),
      providesTags: (_r, _e, id) => [{ type: 'PaymentRequest', id }],
      keepUnusedDataFor: 60,
    }),

    updatePaymentRequestAdmin: b.mutation<
      PaymentRequestAdmin,
      { id: string; body: UpdatePaymentRequestAdminBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toUpdatePaymentRequestAdminBody(body),
      }),
      transformResponse: (res: unknown): PaymentRequestAdmin => normalizePaymentRequestRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PaymentRequest', id: arg.id },
        { type: 'PaymentRequests', id: 'ADMIN_LIST' },
      ],
    }),

    setPaymentRequestStatusAdmin: b.mutation<
      PaymentRequestAdmin,
      { id: string; body: SetPaymentRequestStatusAdminBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/status`,
        method: 'PATCH',
        body: toSetPaymentRequestStatusAdminBody(body),
      }),
      transformResponse: (res: unknown): PaymentRequestAdmin => normalizePaymentRequestRow(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'PaymentRequest', id: arg.id },
        { type: 'PaymentRequests', id: 'ADMIN_LIST' },
      ],
    }),

    deletePaymentRequestAdmin: b.mutation<DeletePaymentRequestResp, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): DeletePaymentRequestResp =>
        normalizeDeletePaymentRequestResp(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PaymentRequest', id },
        { type: 'PaymentRequests', id: 'ADMIN_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentRequestsAdminQuery,
  useGetPaymentRequestAdminByIdQuery,
  useUpdatePaymentRequestAdminMutation,
  useSetPaymentRequestStatusAdminMutation,
  useDeletePaymentRequestAdminMutation,
} = paymentRequestsAdminApi;
