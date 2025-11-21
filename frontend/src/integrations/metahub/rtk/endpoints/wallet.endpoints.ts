// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ApiWalletDepositRequest,
  WalletDepositRequest,
  WalletDepositStatus,
  ListParams,
  QueryParamsStrict,
  ApiWalletTransaction,
  WalletTransaction,
  ListTxnParams,
} from "@/integrations/metahub/rtk/types/wallet";

/* ---------------- helpers ---------------- */
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x ?? 0);

const DEFAULT_PLUCK_KEYS = [
  "data",
  "items",
  "rows",
  "result",
  "requests",
  "wallet_deposit_requests",
  "transactions",
  "wallet_transactions",
] as const;

const pluckArray = <T>(res: unknown, keys: readonly string[] = DEFAULT_PLUCK_KEYS): T[] => {
  if (Array.isArray(res)) return res as T[];
  if (isObj(res)) {
    for (const k of keys) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
};

const readOptionalString = (obj: unknown, key: string): string | undefined => {
  if (!isObj(obj)) return undefined;
  const val = obj[key];
  return typeof val === "string" ? val : undefined;
};

const normalizeOrder = (ord?: string): string | undefined =>
  ord === "asc" || ord === "desc" ? `created_at.${ord}` : ord;

const toWdrParams = (p?: ListParams): QueryParamsStrict | undefined => {
  if (!p) return undefined;
  const q: Partial<QueryParamsStrict> = {};
  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status as WalletDepositStatus;
  if (typeof p.limit === "number") q.limit = p.limit;
  if (typeof p.offset === "number") q.offset = p.offset;
  const ord = normalizeOrder(p.order);
  if (ord) q.order = ord;
  return Object.keys(q).length ? (q as QueryParamsStrict) : undefined;
};

const toTxnParams = (p?: ListTxnParams): QueryParamsStrict | undefined => {
  if (!p) return undefined;
  const q: Partial<QueryParamsStrict> = {};
  if (p.user_id) q.user_id = p.user_id;
  if (typeof p.limit === "number") q.limit = p.limit;
  if (typeof p.offset === "number") q.offset = p.offset;
  const ord = normalizeOrder(p.order);
  if (ord) q.order = ord;
  return Object.keys(q).length ? (q as QueryParamsStrict) : undefined;
};

const dropUserId = (
  qp?: QueryParamsStrict
): Partial<Omit<QueryParamsStrict, "user_id">> | undefined => {
  if (!qp) return undefined;
  const { user_id: _omit, ...rest } = qp as unknown as Record<string, unknown>;
  return rest as Partial<Omit<QueryParamsStrict, "user_id">>;
};

/* ---------------- normalizers ---------------- */
const normalizeWdr = (r: ApiWalletDepositRequest): WalletDepositRequest => ({
  ...r,
  amount: toNumber(r.amount),
  payment_proof: r.payment_proof ?? readOptionalString(r, "proof_image_url") ?? null,
  admin_notes: r.admin_notes ?? readOptionalString(r, "admin_note") ?? null,
  processed_at: r.processed_at ?? null,
});

const normalizeTxn = (t: ApiWalletTransaction): WalletTransaction => ({
  ...t,
  amount: toNumber(t.amount),
  description: t.description ?? null,
});

/* ---------------- endpoints ---------------- */
export const walletApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ==== Deposit Requests ==== */
    listWalletDepositRequests: b.query<WalletDepositRequest[], ListParams | void>({
      query: (params): FetchArgs => {
        const qp = toWdrParams(params as ListParams | undefined);
        return qp
          ? { url: "/wallet_deposit_requests", params: qp }
          : { url: "/wallet_deposit_requests" };
      },
      transformResponse: (res: unknown): WalletDepositRequest[] =>
        pluckArray<ApiWalletDepositRequest>(res).map(normalizeWdr),
      providesTags: (result) =>
        result
          ? [
            ...result.map((r) => ({ type: "WalletDepositRequests" as const, id: r.id })),
            { type: "WalletDepositRequests" as const, id: "LIST" },
          ]
          : [{ type: "WalletDepositRequests" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),

    createWalletDepositRequest: b.mutation<
      WalletDepositRequest,
      { user_id: string; amount: number; payment_method?: string; payment_proof?: string | null }
    >({
      query: (body): FetchArgs => ({
        url: "/wallet_deposit_requests",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): WalletDepositRequest =>
        normalizeWdr(res as ApiWalletDepositRequest),
      invalidatesTags: [{ type: "WalletDepositRequests", id: "LIST" }],
    }),

    updateWalletDepositRequest: b.mutation<
      WalletDepositRequest,
      {
        id: string;
        patch: Partial<
          Pick<WalletDepositRequest, "status" | "admin_notes" | "payment_proof" | "processed_at">
        >;
      }
    >({
      query: ({ id, patch }): FetchArgs => ({
        url: `/wallet_deposit_requests/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (res: unknown): WalletDepositRequest =>
        normalizeWdr(res as ApiWalletDepositRequest),
      invalidatesTags: (_r, _e, arg) => [
        { type: "WalletDepositRequests", id: arg.id },
        { type: "WalletDepositRequests", id: "LIST" },
        { type: "WalletTransactions", id: "LIST" },
      ],
    }),

    /* ==== Wallet Transactions (ADMIN) ==== */
    listWalletTransactions: b.query<WalletTransaction[], ListTxnParams | void>({
      query: (params): FetchArgs => {
        const qp = toTxnParams(params as ListTxnParams | undefined);
        return qp
          ? { url: "/wallet_transactions", params: qp }
          : { url: "/wallet_transactions" };
      },
      transformResponse: (res: unknown): WalletTransaction[] =>
        pluckArray<ApiWalletTransaction>(res).map(normalizeTxn),
      providesTags: (result) =>
        result
          ? [
            ...result.map((t) => ({ type: "WalletTransactions" as const, id: t.id })),
            { type: "WalletTransactions" as const, id: "LIST" },
          ]
          : [{ type: "WalletTransactions" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),

    /* ==== Me: Wallet Balance ==== */
    getMyWalletBalance: b.query<number, void>({
      query: (): FetchArgs => ({ url: "/me/wallet_balance" }),
      transformResponse: (res: unknown): number => {
        if (isObj(res) && "balance" in res) {
          const v = (res as { balance: unknown }).balance;
          return typeof v === "number" ? v : Number(v ?? 0);
        }
        return 0;
      },
      providesTags: [{ type: "WalletTransactions", id: "LIST" }],
      keepUnusedDataFor: 15,
    }),

    /* ==== Me: Wallet Transactions ==== */
    listMyWalletTransactions: b.query<
      WalletTransaction[],
      { limit?: number; offset?: number; order?: "asc" | "desc" | string } | void
    >({
      query: (params): FetchArgs => {
        const qp = toTxnParams(params as ListTxnParams | undefined);
        const meParams = dropUserId(qp);
        return meParams && Object.keys(meParams).length > 0
          ? { url: "/me/wallet_transactions", params: meParams as Record<string, unknown> }
          : { url: "/me/wallet_transactions" };
      },
      transformResponse: (res: unknown): WalletTransaction[] =>
        pluckArray<ApiWalletTransaction>(res).map(normalizeTxn),
      providesTags: (result) =>
        result
          ? [
            ...result.map((t) => ({ type: "WalletTransactions" as const, id: t.id })),
            { type: "WalletTransactions" as const, id: "LIST" },
          ]
          : [{ type: "WalletTransactions" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),

    /* ==== Admin: Adjust User Wallet ==== */
    adjustUserWallet: b.mutation<
      { ok: boolean; balance: number; transaction: WalletTransaction },
      { id: string; amount: number; description?: string }
    >({
      query: ({ id, amount, description }): FetchArgs => ({
        url: `/admin/users/${id}/wallet/adjust`,
        method: "POST",
        body: { amount, description },
      }),
      transformResponse: (res: unknown) => {
        const ok = isObj(res) && Boolean((res as Record<string, unknown>).ok);
        const balanceRaw = isObj(res) ? (res as Record<string, unknown>).balance : 0;
        const txnRaw = isObj(res) ? (res as Record<string, unknown>).transaction : undefined;
        const txn = normalizeTxn((txnRaw ?? {}) as ApiWalletTransaction);
        return { ok, balance: toNumber(balanceRaw), transaction: txn };
      },
      invalidatesTags: [{ type: "WalletTransactions", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWalletDepositRequestsQuery,
  useCreateWalletDepositRequestMutation,
  useUpdateWalletDepositRequestMutation,
  useListWalletTransactionsQuery,   // admin
  useGetMyWalletBalanceQuery,       // me
  useListMyWalletTransactionsQuery, // me
  useAdjustUserWalletMutation,
} = walletApi;
