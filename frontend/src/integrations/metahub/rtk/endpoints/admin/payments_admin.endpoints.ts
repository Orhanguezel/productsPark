// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payments_admin.endpoints.ts
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

export type PaymentStatus =
  | "requires_action"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "voided"
  | "failed";

export type PaymentAdmin = {
  id: string;
  order_id: string | null;
  provider: string; // e.g., stripe, paytr, iyzico, coinbase
  currency: string;
  amount_authorized: number; // total authorized
  amount_captured: number;   // captured so far
  amount_refunded: number;   // refunded so far
  fee_amount: number | null; // gateway fee (optional)
  status: PaymentStatus;
  reference: string | null;  // gateway payment intent id
  transaction_id: string | null; // capture trans id if exists
  is_test: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string; // ISO
  updated_at: string | null; // ISO
};

export type ApiPayment = Omit<
  PaymentAdmin,
  | "amount_authorized" | "amount_captured" | "amount_refunded" | "fee_amount"
  | "is_test" | "updated_at"
> & {
  amount_authorized: number | string;
  amount_captured: number | string;
  amount_refunded: number | string;
  fee_amount: number | string | null;
  is_test: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  updated_at: string | null;
};

const normalizePayment = (p: ApiPayment): PaymentAdmin => ({
  ...p,
  order_id: (p.order_id ?? null) as string | null,
  reference: (p.reference ?? null) as string | null,
  transaction_id: (p.transaction_id ?? null) as string | null,
  amount_authorized: toNumber(p.amount_authorized),
  amount_captured: toNumber(p.amount_captured),
  amount_refunded: toNumber(p.amount_refunded),
  fee_amount: toNullableNumber(p.fee_amount),
  is_test: toBool(p.is_test),
  metadata: (p.metadata ?? null) as Record<string, unknown> | null,
  updated_at: p.updated_at ? toIso(p.updated_at) : null,
});

export type PaymentEvent = {
  id: string;
  payment_id: string;
  event_type: "status_change" | "webhook" | "capture" | "refund" | "void" | "note" | "sync" | "error";
  message: string;
  raw?: Record<string, unknown> | null;
  created_at: string; // ISO
};

export type ApiPaymentEvent = Omit<PaymentEvent, never>;

export type ListParams = {
  q?: string; // search by reference/transaction_id
  provider?: string;
  status?: PaymentStatus;
  order_id?: string;
  is_test?: boolean;
  min_amount?: number; max_amount?: number; // based on authorized or captured (BE decides)
  starts_at?: string; ends_at?: string; // created_at range
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "amount_captured" | "amount_authorized" | "status";
  order?: "asc" | "desc";
  include?: Array<"order">;
};

export type CaptureBody = { amount?: number | null; idempotency_key?: string | null };
export type RefundBody = { amount?: number | null; reason?: string | null };
export type VoidBody = { reason?: string | null };

/** ListParams -> URL query string için güvenli params objesi */
function toFetchParams(
  p: ListParams
): Record<string, string | number | boolean | undefined> {
  return {
    q: p.q,
    provider: p.provider,
    status: p.status,
    order_id: p.order_id,
    is_test: p.is_test ?? undefined,
    min_amount: p.min_amount,
    max_amount: p.max_amount,
    starts_at: p.starts_at,
    ends_at: p.ends_at,
    limit: p.limit,
    offset: p.offset,
    sort: p.sort,
    order: p.order,
    include: p.include && p.include.length ? p.include.join(",") : undefined,
  };
}

export const paymentsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentsAdmin: b.query<PaymentAdmin[], ListParams | void>({
      query: (params) => {
        // params yoksa property'yi eklemeyelim (TS2322 fix)
        const args: { url: string; params?: Record<string, string | number | boolean | undefined> } = {
          url: "/payments",
        };
        if (params) args.params = toFetchParams(params);
        return args;
      },
      transformResponse: (res: unknown): PaymentAdmin[] =>
        Array.isArray(res) ? (res as ApiPayment[]).map(normalizePayment) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Payments" as const, id: p.id })),
              { type: "Payments" as const, id: "LIST" },
            ]
          : [{ type: "Payments" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPaymentAdminById: b.query<PaymentAdmin, string>({
      query: (id) => ({ url: `/payments/${id}` }),
      transformResponse: (res: unknown): PaymentAdmin => normalizePayment(res as ApiPayment),
      providesTags: (_r, _e, id) => [{ type: "Payments", id }],
    }),

    capturePaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: CaptureBody }>({
      query: ({ id, body }) => ({ url: `/payments/${id}/capture`, method: "POST", body }),
      transformResponse: (res: unknown): PaymentAdmin => normalizePayment(res as ApiPayment),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payments", id: arg.id }, { type: "Payments", id: "LIST" }],
    }),

    refundPaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: RefundBody }>({
      query: ({ id, body }) => ({ url: `/payments/${id}/refund`, method: "POST", body }),
      transformResponse: (res: unknown): PaymentAdmin => normalizePayment(res as ApiPayment),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payments", id: arg.id }, { type: "Payments", id: "LIST" }],
    }),

    voidPaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: VoidBody }>({
      query: ({ id, body }) => ({ url: `/payments/${id}/void`, method: "POST", body }),
      transformResponse: (res: unknown): PaymentAdmin => normalizePayment(res as ApiPayment),
      invalidatesTags: (_r, _e, arg) => [{ type: "Payments", id: arg.id }, { type: "Payments", id: "LIST" }],
    }),

    syncPaymentAdmin: b.mutation<PaymentAdmin, string>({
      query: (id) => ({ url: `/payments/${id}/sync`, method: "POST" }),
      transformResponse: (res: unknown): PaymentAdmin => normalizePayment(res as ApiPayment),
      invalidatesTags: (_r, _e, id) => [{ type: "Payments", id }, { type: "Payments", id: "LIST" }],
    }),

    listPaymentEventsAdmin: b.query<PaymentEvent[], string>({
      query: (id) => ({ url: `/payments/${id}/events` }),
      transformResponse: (res: unknown): PaymentEvent[] =>
        Array.isArray(res) ? (res as PaymentEvent[]) : [],
      providesTags: (_r, _e, id) => [{ type: "Payments", id: `EVENTS_${id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentsAdminQuery,
  useGetPaymentAdminByIdQuery,
  useCapturePaymentAdminMutation,
  useRefundPaymentAdminMutation,
  useVoidPaymentAdminMutation,
  useSyncPaymentAdminMutation,
  useListPaymentEventsAdminQuery,
} = paymentsAdminApi;
