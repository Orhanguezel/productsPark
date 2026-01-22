// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet.endpoints.ts
// FINAL — Wallet Public RTK (create deposit + me balance + me txns)
// BaseApi prefix assumed: "/api" (handled inside baseApi)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { WalletDepositRequest, WalletTransaction, ListTxnParams } from '@/integrations/types';

import {
  toWalletTxnListQuery,
  dropUserIdFromQuery,
  normalizeWalletDepositRequest,
  normalizeWalletTransactions,
  normalizeWalletBalance,
} from '@/integrations/types';

const BASE = '/wallet';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['WalletMe', 'WalletMeTransactions', 'WalletDepositRequestsMe'] as const,
});

export const walletApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /* ================= Public: Create Deposit Request ================= */

    // POST /wallet/deposit_requests
    createWalletDepositRequest: b.mutation<
      WalletDepositRequest,
      {
        // user_id BE’de JWT ile override ediliyor, ama FE tarafında opsiyonel bırakmak iyi.
        user_id?: string;
        amount: number;
        payment_method?: string;
        payment_proof?: string | null;
        proof_image_url?: string | null;
      }
    >({
      query: (body): FetchArgs => ({
        url: `${BASE}/deposit_requests`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown) => normalizeWalletDepositRequest(res),
      invalidatesTags: [
        { type: 'WalletDepositRequestsMe', id: 'LIST' },
        { type: 'WalletMeTransactions', id: 'LIST' },
        { type: 'WalletMe', id: 'BALANCE' },
      ],
    }),

    /* ================= Public: Me Balance ================= */

    // GET /wallet/me/balance
    getMyWalletBalance: b.query<number, void>({
      query: (): FetchArgs => ({ url: `${BASE}/me/balance`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeWalletBalance(res),
      providesTags: [{ type: 'WalletMe', id: 'BALANCE' }],
      keepUnusedDataFor: 15,
    }),

    /* ================= Public: Me Transactions ================= */

    // GET /wallet/me/transactions
    listMyWalletTransactions: b.query<
      WalletTransaction[],
      { limit?: number; offset?: number; order?: 'asc' | 'desc' | string } | void
    >({
      query: (params): FetchArgs => {
        const qp = toWalletTxnListQuery(params as ListTxnParams | void);
        const meParams = dropUserIdFromQuery(qp);
        return meParams
          ? { url: `${BASE}/me/transactions`, method: 'GET', params: meParams }
          : { url: `${BASE}/me/transactions`, method: 'GET' };
      },
      transformResponse: (res: unknown) => normalizeWalletTransactions(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((t) => ({ type: 'WalletMeTransactions' as const, id: t.id })),
              { type: 'WalletMeTransactions' as const, id: 'LIST' },
            ]
          : [{ type: 'WalletMeTransactions' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateWalletDepositRequestMutation,
  useGetMyWalletBalanceQuery,
  useListMyWalletTransactionsQuery,
} = walletApi;
