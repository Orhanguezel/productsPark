
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet_transactions.endpoints.ts
// =============================================================
import { baseApi as baseApi_m9 } from "../baseApi";

const toNumber_m9 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type WalletTxnType = "credit" | "debit" | "refund";
export type WalletTxnStatus = "pending" | "completed" | "failed";

export type WalletTransaction = {
  id: string;
  user_id: string;
  type: WalletTxnType;
  status: WalletTxnStatus;
  amount: number;
  currency: string;
  description?: string | null;
  created_at: string;
};

export type ApiWalletTransaction = Omit<WalletTransaction, "amount"> & { amount: number | string };

const normalizeWalletTxn = (t: ApiWalletTransaction): WalletTransaction => ({ ...t, amount: toNumber_m9(t.amount) });

export const walletTransactionsApi = baseApi_m9.injectEndpoints({
  endpoints: (b) => ({
    listWalletTransactions: b.query<WalletTransaction[], { user_id?: string; status?: WalletTxnStatus; limit?: number; offset?: number; order?: "asc" | "desc" }>({
      query: (params) => ({ url: "/wallet_transactions", params }),
      transformResponse: (res: unknown): WalletTransaction[] => Array.isArray(res) ? (res as ApiWalletTransaction[]).map(normalizeWalletTxn) : [],
      providesTags: (result) => result
        ? [...result.map((t) => ({ type: "WalletTransactions" as const, id: t.id })), { type: "WalletTransactions" as const, id: "LIST" }]
        : [{ type: "WalletTransactions" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListWalletTransactionsQuery } = walletTransactionsApi;
