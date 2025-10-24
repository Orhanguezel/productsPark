// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/wallet_deposit_requests.endpoints.ts
// =============================================================
import { baseApi as baseApi_wdr } from "../baseApi";

const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type WalletDepositStatus = "pending" | "approved" | "rejected" | string;

export type WalletDepositRequest = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string; // "havale" vb.
  payment_proof?: string | null;
  status: WalletDepositStatus;
  admin_notes?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
};

type ApiWalletDepositRequest = Omit<WalletDepositRequest, "amount"> & { amount: number | string };

const normalize = (r: ApiWalletDepositRequest): WalletDepositRequest => ({
  ...r,
  amount: toNumber(r.amount),
  payment_proof: r.payment_proof ?? null,
  admin_notes: r.admin_notes ?? null,
  processed_at: r.processed_at ?? null,
});

export const walletDepositRequestsApi = baseApi_wdr.injectEndpoints({
  endpoints: (b) => ({
    listWalletDepositRequests: b.query<
      WalletDepositRequest[],
      { user_id?: string; status?: WalletDepositStatus; limit?: number; offset?: number; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/wallet_deposit_requests", params }),
      transformResponse: (res: unknown): WalletDepositRequest[] =>
        Array.isArray(res) ? (res as ApiWalletDepositRequest[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [...result.map((r) => ({ type: "WalletDepositRequests" as const, id: r.id })), { type: "WalletDepositRequests" as const, id: "LIST" }]
          : [{ type: "WalletDepositRequests" as const, id: "LIST" }],
    }),

    createWalletDepositRequest: b.mutation<
      WalletDepositRequest,
      { user_id: string; amount: number; payment_method: string; payment_proof?: string | null }
    >({
      query: (body) => ({
        url: "/wallet_deposit_requests",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): WalletDepositRequest => normalize(res as ApiWalletDepositRequest),
      invalidatesTags: [{ type: "WalletDepositRequests", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWalletDepositRequestsQuery,
  useCreateWalletDepositRequestMutation,
} = walletDepositRequestsApi;
