
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payouts_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : String(x).toLowerCase() === "true" || String(x) === "1");

export type PayoutStatus = "pending" | "approved" | "processing" | "paid" | "failed" | "cancelled";

export type Payout = {
  id: string;
  batch_id: string | null;
  destination: string;         // bank_acc_id / iban / wallet
  vendor_id: string | null;    // marketplace vendor or null
  method: "bank_transfer" | "wallet" | "ach" | "sepa" | "other";
  currency: string;            // TRY, USD, ...
  amount: number;              // minor units
  fee_amount: number;          // minor units
  net_amount: number;          // minor units
  reference: string | null;    // external reference
  status: PayoutStatus;
  scheduled_at: string | null; // ISO
  processed_at: string | null; // ISO
  created_at: string;          // ISO
  updated_at: string | null;   // ISO
  error_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ApiPayout = Omit<Payout, "amount" | "fee_amount" | "net_amount"> & {
  amount: number | string;
  fee_amount: number | string;
  net_amount: number | string;
};

const normalizePayout = (p: ApiPayout): Payout => ({
  ...p,
  batch_id: (p.batch_id ?? null) as string | null,
  vendor_id: (p.vendor_id ?? null) as string | null,
  reference: (p.reference ?? null) as string | null,
  amount: toNumber(p.amount),
  fee_amount: toNumber(p.fee_amount),
  net_amount: toNumber(p.net_amount),
  scheduled_at: p.scheduled_at ? toIso(p.scheduled_at) : null,
  processed_at: p.processed_at ? toIso(p.processed_at) : null,
  updated_at: p.updated_at ? toIso(p.updated_at) : null,
  error_code: (p.error_code ?? null) as string | null,
  error_message: (p.error_message ?? null) as string | null,
  metadata: (p.metadata ?? null) as Record<string, unknown> | null,
});

export type PayoutListParams = {
  q?: string; // destination/vendor/reference
  status?: PayoutStatus;
  vendor_id?: string;
  batch_id?: string;
  method?: Payout["method"];
  created_from?: string; created_to?: string;  // ISO
  processed_from?: string; processed_to?: string; // ISO
  min_amount?: number; max_amount?: number;   // minor units
  limit?: number; offset?: number;
  sort?: "created_at" | "processed_at" | "amount" | "status";
  order?: "asc" | "desc";
};

export type ApprovePayoutBody = { note?: string | null };
export type DenyPayoutBody = { reason?: string | null };
export type ExecutePayoutBody = { force?: boolean | 0 | 1 };
export type RetryPayoutBody = { reason?: string | null };
export type CancelPayoutBody = { reason?: string | null };

export type PayoutBatch = {
  id: string;
  title: string | null;
  currency: string;
  total_count: number;
  total_amount: number;  // minor units
  status: "draft" | "finalized" | "processing" | "paid" | "failed" | "cancelled";
  created_at: string;    // ISO
  finalized_at: string | null; // ISO
};

export type ApiPayoutBatch = Omit<PayoutBatch, "total_amount"> & { total_amount: number | string };
const normalizeBatch = (b: ApiPayoutBatch): PayoutBatch => ({ ...b, total_amount: toNumber(b.total_amount), finalized_at: b.finalized_at ? toIso(b.finalized_at) : null });

export type CreateBatchBody = {
  title?: string | null;
  currency: string;
  items: Array<{ destination: string; amount: number; vendor_id?: string | null; method: Payout["method"]; reference?: string | null }>;
};

export type PayoutsExportParams = PayoutListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

export const payoutsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPayoutsAdmin: b.query<Payout[], PayoutListParams | void>({
      query: (params) => ({ url: "/payouts", params }),
      transformResponse: (res: unknown): Payout[] => {
        if (Array.isArray(res)) return (res as ApiPayout[]).map(normalizePayout);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiPayout[]).map(normalizePayout) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((p) => ({ type: "Payouts" as const, id: p.id })),
        { type: "Payouts" as const, id: "LIST" },
      ] : [{ type: "Payouts" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPayoutAdminById: b.query<Payout, string>({
      query: (id) => ({ url: `/payouts/${id}` }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      providesTags: (_r, _e, id) => [{ type: "Payouts", id }],
    }),

    approvePayoutAdmin: b.mutation<Payout, { id: string; body?: ApprovePayoutBody }>({
      query: ({ id, body }) => ({ url: `/payouts/${id}/approve`, method: "POST", body }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payouts", id: arg.id }, { type: "Payouts", id: "LIST" }],
    }),

    denyPayoutAdmin: b.mutation<Payout, { id: string; body?: DenyPayoutBody }>({
      query: ({ id, body }) => ({ url: `/payouts/${id}/deny`, method: "POST", body }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payouts", id: arg.id }, { type: "Payouts", id: "LIST" }],
    }),

    executePayoutAdmin: b.mutation<Payout, { id: string; body?: ExecutePayoutBody }>({
      query: ({ id, body }) => ({ url: `/payouts/${id}/execute`, method: "POST", body }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payouts", id: arg.id }, { type: "Payouts", id: "LIST" }],
    }),

    retryPayoutAdmin: b.mutation<Payout, { id: string; body?: RetryPayoutBody }>({
      query: ({ id, body }) => ({ url: `/payouts/${id}/retry`, method: "POST", body }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payouts", id: arg.id }, { type: "Payouts", id: "LIST" }],
    }),

    cancelPayoutAdmin: b.mutation<Payout, { id: string; body?: CancelPayoutBody }>({
      query: ({ id, body }) => ({ url: `/payouts/${id}/cancel`, method: "POST", body }),
      transformResponse: (res: unknown): Payout => normalizePayout(res as ApiPayout),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payouts", id: arg.id }, { type: "Payouts", id: "LIST" }],
    }),

    exportPayoutsAdmin: b.mutation<ExportResponse, PayoutsExportParams | void>({
      query: (params) => ({ url: `/payouts/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),

    // ---- Batches ----
    createPayoutBatchAdmin: b.mutation<PayoutBatch, CreateBatchBody>({
      query: (body) => ({ url: "/payout_batches", method: "POST", body }),
      transformResponse: (res: unknown): PayoutBatch => normalizeBatch(res as ApiPayoutBatch),
      invalidatesTags: [{ type: "PayoutBatches" as const, id: "LIST" }],
    }),

    getPayoutBatchAdmin: b.query<PayoutBatch, string>({
      query: (id) => ({ url: `/payout_batches/${id}` }),
      transformResponse: (res: unknown): PayoutBatch => normalizeBatch(res as ApiPayoutBatch),
      providesTags: (_r, _e, id) => [{ type: "PayoutBatches", id }],
    }),

    listPayoutBatchItemsAdmin: b.query<Payout[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/payout_batches/${id}/items`, params: { limit, offset } }),
      transformResponse: (res: unknown): Payout[] => Array.isArray(res) ? (res as ApiPayout[]).map(normalizePayout) : [],
      providesTags: (_r, _e, arg) => [{ type: "PayoutBatches", id: `ITEMS_${arg.id}` }],
    }),

    finalizePayoutBatchAdmin: b.mutation<PayoutBatch, string>({
      query: (id) => ({ url: `/payout_batches/${id}/finalize`, method: "POST" }),
      transformResponse: (res: unknown): PayoutBatch => normalizeBatch(res as ApiPayoutBatch),
      invalidatesTags: (_r, _e, id) => [{ type: "PayoutBatches", id }, { type: "PayoutBatches", id: "LIST" }],
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
