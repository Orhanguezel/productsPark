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
} from "@/integrations/metahub/db/types/wallet";

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

/* ---------------- normalizers ---------------- */
const normalizeWdr = (r: ApiWalletDepositRequest): WalletDepositRequest => ({
  ...r,
  amount: toNumber(r.amount),
  payment_proof: r.payment_proof ?? r.proof_image_url ?? null,
  admin_notes: r.admin_notes ?? r.admin_note ?? null,
  processed_at: r.processed_at ?? null,
});

const normalizeTxn = (t: ApiWalletTransaction): WalletTransaction => ({
  ...t,
  amount: toNumber(t.amount),
  description: t.description ?? null,
});

/* ---------------- query param builders ---------------- */
const normalizeOrder = (ord?: string): string | undefined => {
  if (ord === "asc" || ord === "desc") return `created_at.${ord}`;
  return ord;
};

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

/* ---------------- types (endpoint-specific) ---------------- */
type AdjustWalletApiResult = {
  ok: boolean;
  balance: number | string;
  transaction: ApiWalletTransaction;
};

type AdjustWalletResult = {
  ok: boolean;
  balance: number;
  transaction: WalletTransaction;
};

/* ---------------- endpoints (combined) ---------------- */
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
      // BE: POST /wallet_deposit_requests (auth)
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
      { id: string; patch: Partial<Pick<WalletDepositRequest, "status" | "admin_notes" | "payment_proof" | "processed_at">> }
    >({
      // BE: PATCH /wallet_deposit_requests/:id (admin)
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
        // onay/ret durumunda genelde txn listesi değişir:
        { type: "WalletTransactions", id: "LIST" },
      ],
    }),

    /* ==== Wallet Transactions ==== */

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

    /* ==== Admin: Adjust User Wallet (atomik) ==== */
    adjustUserWallet: b.mutation<
      AdjustWalletResult,
      { id: string; amount: number; description?: string }
    >({
      // BE: POST /admin/users/:id/wallet/adjust (admin)
      query: ({ id, amount, description }): FetchArgs => ({
        url: `/admin/users/${id}/wallet/adjust`,
        method: "POST",
        body: { amount, description },
      }),
      transformResponse: (res: unknown): AdjustWalletResult => {
        const r = res as AdjustWalletApiResult;
        return {
          ok: !!r.ok,
          balance: toNumber(r.balance),
          transaction: normalizeTxn(r.transaction),
        };
      },
      // txn listesi değişir → invalidates
      invalidatesTags: [{ type: "WalletTransactions", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWalletDepositRequestsQuery,
  useCreateWalletDepositRequestMutation,
  useUpdateWalletDepositRequestMutation,
  useListWalletTransactionsQuery,
  useAdjustUserWalletMutation,
} = walletApi;
