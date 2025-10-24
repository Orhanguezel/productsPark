// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet_transactions.endpoints.ts
// =============================================================
import { baseApi as baseApi_m9 } from "../baseApi";

const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type WalletTxnType = "deposit" | "withdrawal" | "purchase" | "refund";

export type WalletTransaction = {
  id: string;
  user_id: string;
  type: WalletTxnType;
  amount: number;
  description: string | null;
  order_id?: string | null;
  created_at: string;
};

export type ApiWalletTransaction = Omit<WalletTransaction, "amount" | "description"> & {
  amount: number | string;
  description?: string | null;
};

const normalize = (t: ApiWalletTransaction): WalletTransaction => ({
  ...t,
  amount: toNumber(t.amount),
  description: t.description ?? null,
});

export const walletTransactionsApi = baseApi_m9.injectEndpoints({
  endpoints: (b) => ({
    listWalletTransactions: b.query<
      WalletTransaction[],
      { user_id?: string; limit?: number; offset?: number; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/wallet_transactions", params }),
      transformResponse: (res: unknown): WalletTransaction[] =>
        Array.isArray(res) ? (res as ApiWalletTransaction[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "WalletTransactions" as const, id: t.id })), { type: "WalletTransactions" as const, id: "LIST" }]
          : [{ type: "WalletTransactions" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListWalletTransactionsQuery } = walletTransactionsApi;
