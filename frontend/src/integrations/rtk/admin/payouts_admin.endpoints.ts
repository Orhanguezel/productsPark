// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payouts_admin.endpoints.ts
// FINAL — Payouts (ADMIN) RTK
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';

import type {
  Payout,
  PayoutBatch,
  PayoutListParams,
  PayoutsExportParams,
  ExportResponse,
  ApprovePayoutBody,
  DenyPayoutBody,
  ExecutePayoutBody,
  RetryPayoutBody,
  CancelPayoutBody,
  CreateBatchBody,
} from '@/integrations/types';

import {
  normalizePayout,
  normalizePayouts,
  normalizePayoutBatch,
  toPayoutListQuery,
  toExecuteBody,
  normalizeExportResponse,
} from '@/integrations/types';

const BASE = '/payouts';
const BATCH_BASE = '/payout_batches';

export const payoutsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // -------------------- Payouts --------------------

    listPayoutsAdmin: b.query<Payout[], PayoutListParams | void>({
      query: (params) => {
        const qp = params ? toPayoutListQuery(params) : undefined;
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): Payout[] => normalizePayouts(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((p) => ({ type: 'Payout' as const, id: p.id })),
              { type: 'Payouts' as const, id: 'LIST' },
            ]
          : [{ type: 'Payouts' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getPayoutAdminById: b.query<Payout, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      providesTags: (_r, _e, id) => [{ type: 'Payout' as const, id }],
    }),

    approvePayoutAdmin: b.mutation<Payout, { id: string; body?: ApprovePayoutBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/approve`,
        method: 'POST',
        ...(body ? { body } : {}),
      }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payout' as const, id: arg.id },
        { type: 'Payouts' as const, id: 'LIST' },
      ],
    }),

    denyPayoutAdmin: b.mutation<Payout, { id: string; body?: DenyPayoutBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/deny`,
        method: 'POST',
        ...(body ? { body } : {}),
      }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payout' as const, id: arg.id },
        { type: 'Payouts' as const, id: 'LIST' },
      ],
    }),

    executePayoutAdmin: b.mutation<Payout, { id: string; body?: ExecutePayoutBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/execute`,
        method: 'POST',
        ...(body ? { body: toExecuteBody(body) ?? {} } : {}),
      }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payout' as const, id: arg.id },
        { type: 'Payouts' as const, id: 'LIST' },
      ],
    }),

    retryPayoutAdmin: b.mutation<Payout, { id: string; body?: RetryPayoutBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/retry`,
        method: 'POST',
        ...(body ? { body } : {}),
      }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payout' as const, id: arg.id },
        { type: 'Payouts' as const, id: 'LIST' },
      ],
    }),

    cancelPayoutAdmin: b.mutation<Payout, { id: string; body?: CancelPayoutBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        ...(body ? { body } : {}),
      }),
      transformResponse: (res: unknown): Payout => normalizePayout(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payout' as const, id: arg.id },
        { type: 'Payouts' as const, id: 'LIST' },
      ],
    }),

    exportPayoutsAdmin: b.mutation<ExportResponse, PayoutsExportParams | void>({
      query: (params) => {
        const qp = params ? toPayoutListQuery(params) : undefined;
        // format ayrıca taşınabilir
        const qp2 =
          params?.format && qp
            ? { ...qp, format: params.format }
            : params?.format
            ? { format: params.format }
            : qp;

        return {
          url: `${BASE}/export`,
          method: 'GET',
          ...(qp2 ? { params: qp2 } : {}),
        };
      },
      transformResponse: (res: unknown): ExportResponse => normalizeExportResponse(res),
    }),

    // -------------------- Batches --------------------

    createPayoutBatchAdmin: b.mutation<PayoutBatch, CreateBatchBody>({
      query: (body) => ({ url: BATCH_BASE, method: 'POST', body }),
      transformResponse: (res: unknown): PayoutBatch => normalizePayoutBatch(res),
      invalidatesTags: [{ type: 'PayoutBatches' as const, id: 'LIST' }],
    }),

    getPayoutBatchAdmin: b.query<PayoutBatch, string>({
      query: (id) => ({ url: `${BATCH_BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): PayoutBatch => normalizePayoutBatch(res),
      providesTags: (_r, _e, id) => [{ type: 'PayoutBatch' as const, id }],
    }),

    listPayoutBatchItemsAdmin: b.query<Payout[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => {
        const params: Record<string, number> = {};
        if (typeof limit === 'number') params.limit = limit;
        if (typeof offset === 'number') params.offset = offset;

        return {
          url: `${BATCH_BASE}/${encodeURIComponent(id)}/items`,
          method: 'GET',
          ...(Object.keys(params).length ? { params } : {}),
        };
      },
      transformResponse: (res: unknown): Payout[] => normalizePayouts(res),
      providesTags: (_r, _e, arg) => [{ type: 'PayoutBatch' as const, id: `ITEMS:${arg.id}` }],
    }),

    finalizePayoutBatchAdmin: b.mutation<PayoutBatch, string>({
      query: (id) => ({ url: `${BATCH_BASE}/${encodeURIComponent(id)}/finalize`, method: 'POST' }),
      transformResponse: (res: unknown): PayoutBatch => normalizePayoutBatch(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PayoutBatch' as const, id },
        { type: 'PayoutBatches' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPayoutsAdminQuery,
  useGetPayoutAdminByIdQuery,
  useApprovePayoutAdminMutation,
  useDenyPayoutAdminMutation,
  useExecutePayoutAdminMutation,
  useRetryPayoutAdminMutation,
  useCancelPayoutAdminMutation,
  useExportPayoutsAdminMutation,
  useCreatePayoutBatchAdminMutation,
  useGetPayoutBatchAdminQuery,
  useListPayoutBatchItemsAdminQuery,
  useFinalizePayoutBatchAdminMutation,
} = payoutsAdminApi;
