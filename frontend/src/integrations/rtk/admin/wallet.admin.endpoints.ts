// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet.admin.endpoints.ts
// FINAL — Wallet Admin RTK
// BaseApi prefix assumed: "/api" (handled inside baseApi)
//
// ✅ ACTUAL admin routes (per your original contract):
// - GET    /admin/wallet/deposit_requests
// - PATCH  /admin/wallet/deposit_requests/:id
// - GET    /admin/wallet/transactions
// - POST   /admin/wallet/users/:id/adjust
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  WalletDepositRequest,
  WalletTransaction,
  ListDepositParams,
  ListTxnParams,
  AdjustWalletResp,
} from '@/integrations/types';

import {
  toWalletDepositListQuery,
  toWalletTxnListQuery,
  normalizeWalletDepositRequests,
  normalizeWalletDepositRequest,
  normalizeWalletTransactions,
  normalizeAdjustWalletResp,
} from '@/integrations/types';

const ADMIN_BASE = '/admin/wallet';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: [
    'WalletAdminDepositRequests',
    'WalletAdminTransactions',
    'WalletAdminUser',
  ] as const,
});

export const walletAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/wallet/deposit_requests
    listWalletDepositRequestsAdmin: b.query<WalletDepositRequest[], ListDepositParams | void>({
      query: (params): FetchArgs => {
        const qp = toWalletDepositListQuery(params);
        return qp
          ? { url: `${ADMIN_BASE}/deposit_requests`, method: 'GET', params: qp }
          : { url: `${ADMIN_BASE}/deposit_requests`, method: 'GET' };
      },
      transformResponse: (res: unknown) => normalizeWalletDepositRequests(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: 'WalletAdminDepositRequests' as const, id: r.id })),
              { type: 'WalletAdminDepositRequests' as const, id: 'LIST' },
            ]
          : [{ type: 'WalletAdminDepositRequests' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    // PATCH /admin/wallet/deposit_requests/:id
    updateWalletDepositRequestAdmin: b.mutation<
      WalletDepositRequest,
      {
        id: string;
        patch: Partial<
          Pick<WalletDepositRequest, 'status' | 'admin_notes' | 'processed_at'> & {
            proof_image_url?: string | null;
            payment_proof?: string | null;
          }
        >;
      }
    >({
      query: ({ id, patch }): FetchArgs => ({
        url: `${ADMIN_BASE}/deposit_requests/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown) => normalizeWalletDepositRequest(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'WalletAdminDepositRequests', id: arg.id },
        { type: 'WalletAdminDepositRequests', id: 'LIST' },
        { type: 'WalletAdminTransactions', id: 'LIST' },
      ],
    }),

    // GET /admin/wallet/transactions
    listWalletTransactionsAdmin: b.query<WalletTransaction[], ListTxnParams | void>({
      query: (params): FetchArgs => {
        const qp = toWalletTxnListQuery(params);
        return qp
          ? { url: `${ADMIN_BASE}/transactions`, method: 'GET', params: qp }
          : { url: `${ADMIN_BASE}/transactions`, method: 'GET' };
      },
      transformResponse: (res: unknown) => normalizeWalletTransactions(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((t) => ({ type: 'WalletAdminTransactions' as const, id: t.id })),
              { type: 'WalletAdminTransactions' as const, id: 'LIST' },
            ]
          : [{ type: 'WalletAdminTransactions' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    // POST /admin/wallet/users/:id/adjust
    adjustUserWalletAdmin: b.mutation<
      AdjustWalletResp,
      { id: string; amount: number; description?: string }
    >({
      query: ({ id, amount, description }): FetchArgs => ({
        url: `${ADMIN_BASE}/users/${encodeURIComponent(id)}/adjust`,
        method: 'POST',
        body: { amount, ...(typeof description !== 'undefined' ? { description } : {}) },
      }),
      transformResponse: (res: unknown) => normalizeAdjustWalletResp(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'WalletAdminTransactions', id: 'LIST' },
        { type: 'WalletAdminUser', id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWalletDepositRequestsAdminQuery,
  useUpdateWalletDepositRequestAdminMutation,
  useListWalletTransactionsAdminQuery,
  useAdjustUserWalletAdminMutation,
} = walletAdminApi;

/**
 * ✅ Backward-compatible aliases (so existing screens don't break)
 * Your UserEdit.tsx currently imports these names:
 * - useListWalletTransactionsQuery
 * - useAdjustUserWalletMutation
 */
export const useListWalletTransactionsQuery = useListWalletTransactionsAdminQuery;
export const useAdjustUserWalletMutation = useAdjustUserWalletAdminMutation;
