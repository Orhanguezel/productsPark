
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/refunds_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

export type RefundStatus =
  | "requested"
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled"
  | "chargeback_open"
  | "chargeback_won"
  | "chargeback_lost";

export type RefundMethod = "original" | "gateway" | "manual" | "store_credit";
export type RefundSource = "user" | "admin" | "system" | "chargeback";
export type RefundReason =
  | "customer_request"
  | "duplicate"
  | "fraud"
  | "not_received"
  | "not_as_described"
  | "service_issue"
  | "chargeback"
  | "other";

export type RefundItem = {
  order_item_id: string;
  qty: number;
  line_amount: number; // refund amount for this line
};

export type Refund = {
  id: string;
  order_id: string;
  payment_id: string | null;
  user_id: string | null;
  user_email: string | null;
  status: RefundStatus;
  method: RefundMethod;
  source: RefundSource;
  amount: number;
  currency: string;
  processor_fee: number | null;
  net_amount: number;
  reason: RefundReason;
  reason_note: string | null;
  items: RefundItem[] | null;
  external_id: string | null;    // PSP tx id
  admin_note: string | null;
  evidence?: Record<string, unknown> | null; // attachments/PSP payloads
  created_at: string;            // ISO
  approved_at: string | null;    // ISO
  completed_at: string | null;   // ISO
  rejected_at: string | null;    // ISO
  cancelled_at: string | null;   // ISO
  updated_at: string | null;     // ISO
};

export type ApiRefund = Omit<Refund,
  | "amount" | "processor_fee" | "net_amount" | "items" | "evidence"
  | "approved_at" | "completed_at" | "rejected_at" | "cancelled_at" | "updated_at"
> & {
  amount: number | string;
  processor_fee: number | string | null;
  net_amount: number | string;
  items: string | RefundItem[] | null;
  evidence: string | Record<string, unknown> | null;
  approved_at: string | null;
  completed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  updated_at: string | null;
};

const normalizeRefund = (r: ApiRefund): Refund => ({
  ...r,
  order_id: String(r.order_id),
  payment_id: (r.payment_id ?? null) as string | null,
  user_id: (r.user_id ?? null) as string | null,
  user_email: (r.user_email ?? null) as string | null,
  amount: toNumber(r.amount),
  processor_fee: toNullableNumber(r.processor_fee),
  net_amount: toNumber(r.net_amount),
  reason_note: (r.reason_note ?? null) as string | null,
  items: r.items == null ? null : tryParse<RefundItem[]>(r.items),
  external_id: (r.external_id ?? null) as string | null,
  admin_note: (r.admin_note ?? null) as string | null,
  evidence: r.evidence == null ? null : tryParse<Record<string, unknown>>(r.evidence),
  approved_at: r.approved_at ? toIso(r.approved_at) : null,
  completed_at: r.completed_at ? toIso(r.completed_at) : null,
  rejected_at: r.rejected_at ? toIso(r.rejected_at) : null,
  cancelled_at: r.cancelled_at ? toIso(r.cancelled_at) : null,
  updated_at: r.updated_at ? toIso(r.updated_at) : null,
});

export type RefundEvent = {
  id: string;
  refund_id: string;
  event_type: "create" | "approve" | "reject" | "complete" | "cancel" | "chargeback_open" | "chargeback_update" | "export" | "sync" | "error";
  message: string;
  payload?: Record<string, unknown> | null;
  created_at: string; // ISO
};

export type ApiRefundEvent = Omit<RefundEvent, never>;

export type RefundListParams = {
  q?: string; // order/payment/user search
  status?: RefundStatus;
  method?: RefundMethod;
  source?: RefundSource;
  user_id?: string; order_id?: string; payment_id?: string;
  min_amount?: number; max_amount?: number;
  created_from?: string; created_to?: string;     // ISO
  completed_from?: string; completed_to?: string; // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "completed_at" | "amount" | "status";
  order?: "asc" | "desc";
};

export type ApproveRefundBody = { admin_note?: string | null };
export type RejectRefundBody = { reason: string; admin_note?: string | null };
export type CompleteRefundBody = { completed_at?: string | null; external_id?: string | null; admin_note?: string | null };
export type ExportParams = RefundListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

// Chargeback actions
export type OpenChargebackBody = { external_dispute_id?: string | null; message?: string | null };
export type ResolveChargebackBody = { outcome: "won" | "lost" | "reversed"; admin_note?: string | null };

export const refundsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listRefundsAdmin: b.query<Refund[], RefundListParams | void>({
      query: (params) => ({ url: "/refunds", params }),
      transformResponse: (res: unknown): Refund[] => {
        if (Array.isArray(res)) return (res as ApiRefund[]).map(normalizeRefund);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiRefund[]).map(normalizeRefund) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((r) => ({ type: "Refunds" as const, id: r.id })),
        { type: "Refunds" as const, id: "LIST" },
      ] : [{ type: "Refunds" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getRefundAdminById: b.query<Refund, string>({
      query: (id) => ({ url: `/refunds/${id}` }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      providesTags: (_r, _e, id) => [{ type: "Refunds", id }],
    }),

    approveRefundAdmin: b.mutation<Refund, { id: string; body?: ApproveRefundBody }>({
      query: ({ id, body }) => ({ url: `/refunds/${id}/approve`, method: "POST", body }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, arg) => [{ type: "Refunds", id: arg.id }, { type: "Refunds", id: "LIST" }],
    }),

    rejectRefundAdmin: b.mutation<Refund, { id: string; body: RejectRefundBody }>({
      query: ({ id, body }) => ({ url: `/refunds/${id}/reject`, method: "POST", body }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, arg) => [{ type: "Refunds", id: arg.id }, { type: "Refunds", id: "LIST" }],
    }),

    completeRefundAdmin: b.mutation<Refund, { id: string; body?: CompleteRefundBody }>({
      query: ({ id, body }) => ({ url: `/refunds/${id}/complete`, method: "POST", body }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, arg) => [{ type: "Refunds", id: arg.id }, { type: "Refunds", id: "LIST" }],
    }),

    cancelRefundAdmin: b.mutation<Refund, string>({
      query: (id) => ({ url: `/refunds/${id}/cancel`, method: "POST" }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, id) => [{ type: "Refunds", id }, { type: "Refunds", id: "LIST" }],
    }),

    // chargeback actions
    openChargebackAdmin: b.mutation<Refund, { id: string; body?: OpenChargebackBody }>({
      query: ({ id, body }) => ({ url: `/refunds/${id}/chargeback/open`, method: "POST", body }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, arg) => [{ type: "Refunds", id: arg.id }, { type: "Refunds", id: "LIST" }],
    }),

    resolveChargebackAdmin: b.mutation<Refund, { id: string; body: ResolveChargebackBody }>({
      query: ({ id, body }) => ({ url: `/refunds/${id}/chargeback/resolve`, method: "POST", body }),
      transformResponse: (res: unknown): Refund => normalizeRefund(res as ApiRefund),
      invalidatesTags: (_r, _e, arg) => [{ type: "Refunds", id: arg.id }, { type: "Refunds", id: "LIST" }],
    }),

    listRefundEventsAdmin: b.query<RefundEvent[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/refunds/${id}/events`, params: { limit, offset } }),
      transformResponse: (res: unknown): RefundEvent[] => Array.isArray(res) ? (res as ApiRefundEvent[]) : [],
      providesTags: (_r, _e, arg) => [{ type: "Refunds", id: `EVT_${arg.id}` }],
    }),

    exportRefundsAdmin: b.mutation<ExportResponse, ExportParams | void>({
      query: (params) => ({ url: `/refunds/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListRefundsAdminQuery,
  useGetRefundAdminByIdQuery,
  useApproveRefundAdminMutation,
  useRejectRefundAdminMutation,
  useCompleteRefundAdminMutation,
  useCancelRefundAdminMutation,
  useOpenChargebackAdminMutation,
  useResolveChargebackAdminMutation,
  useListRefundEventsAdminQuery,
  useExportRefundsAdminMutation,
} = refundsAdminApi;
