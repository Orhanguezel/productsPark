// =============================================================
// FILE: src/integrations/metahub/client/wallets-payments/client.ts
// =============================================================
import { store as store_wp } from "@/store";
import { normalizeError as nErr_wp } from "@/integrations/metahub/core/errors";

import {
  walletTransactionsApi,
  type WalletTransaction,
} from "@/integrations/metahub/rtk/endpoints/wallet_transactions.endpoints";

import {
  paymentRequestsApi,
  type PaymentRequest,
} from "@/integrations/metahub/rtk/endpoints/payment_requests.endpoints";

import {
  walletDepositRequestsApi,
  type WalletDepositRequest,
} from "@/integrations/metahub/rtk/endpoints/wallet_deposit_requests.endpoints";

export type { WalletTransaction, PaymentRequest, WalletDepositRequest };

export const walletsPayments = {
  async wallet(
    params?: Parameters<typeof walletTransactionsApi.endpoints.listWalletTransactions.initiate>[0]
  ) {
    try {
      const data = await store_wp
        .dispatch(walletTransactionsApi.endpoints.listWalletTransactions.initiate(params ?? {}))
        .unwrap();
      return { data: data as WalletTransaction[], error: null as null };
    } catch (e) {
      const { message } = nErr_wp(e);
      return { data: null as WalletTransaction[] | null, error: { message } };
    }
  },

  async payments(
    params?: Parameters<typeof paymentRequestsApi.endpoints.listPaymentRequests.initiate>[0]
  ) {
    try {
      const data = await store_wp
        .dispatch(paymentRequestsApi.endpoints.listPaymentRequests.initiate(params ?? {}))
        .unwrap();
      return { data: data as PaymentRequest[], error: null as null };
    } catch (e) {
      const { message } = nErr_wp(e);
      return { data: null as PaymentRequest[] | null, error: { message } };
    }
  },

  depositRequests: {
    async list(
      params?: Parameters<typeof walletDepositRequestsApi.endpoints.listWalletDepositRequests.initiate>[0]
    ) {
      try {
        const data = await store_wp
          .dispatch(walletDepositRequestsApi.endpoints.listWalletDepositRequests.initiate(params ?? {}))
          .unwrap();
        return { data: data as WalletDepositRequest[], error: null as null };
      } catch (e) {
        const { message } = nErr_wp(e);
        return { data: null as WalletDepositRequest[] | null, error: { message } };
      }
    },

    async create(
      body: Parameters<typeof walletDepositRequestsApi.endpoints.createWalletDepositRequest.initiate>[0]
    ) {
      try {
        const data = await store_wp
          .dispatch(walletDepositRequestsApi.endpoints.createWalletDepositRequest.initiate(body))
          .unwrap();
        return { data: data as WalletDepositRequest, error: null as null };
      } catch (e) {
        const { message } = nErr_wp(e);
        return { data: null as WalletDepositRequest | null, error: { message } };
      }
    },
  },
};
