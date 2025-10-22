
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/subscriptions_admin.endpoints.ts
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
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* ignore */ } }
  return x as T;
};

export type Interval = "day" | "week" | "month" | "year";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "canceled" | "expired" | "incomplete";

export type Plan = {
  id: string;
  code: string;              // unique handle
  name: string;
  amount: number;            // cents/minor units
  currency: string;          // TRY, USD, ...
  interval: Interval;
  interval_count: number;    // e.g. 1 month, 12 months
  trial_days: number | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
};

export type ApiPlan = Omit<Plan, "amount" | "interval_count" | "trial_days" | "is_active"> & {
  amount: number | string;
  interval_count: number | string;
  trial_days: number | string | null;
  is_active: boolean | 0 | 1 | "0" | "1" | string;
};

const normalizePlan = (p: ApiPlan): Plan => ({
  ...p,
  amount: toNumber(p.amount),
  interval_count: toNumber(p.interval_count),
  trial_days: p.trial_days == null ? null : toNumber(p.trial_days),
  is_active: toBool(p.is_active),
  metadata: (p.metadata ?? null) as Record<string, unknown> | null,
});

export type Subscription = {
  id: string;
  user_id: string;
  user_email: string | null;
  plan_id: string;
  plan?: Plan | null;
  status: SubscriptionStatus;
  cancel_at_period_end: boolean;
  start_date: string;                // ISO
  current_period_start: string;      // ISO
  current_period_end: string;        // ISO
  canceled_at: string | null;        // ISO
  pause_at: string | null;           // ISO
  resume_at: string | null;          // ISO
  next_invoice_date: string | null;  // ISO
  quantity: number;                  // seats, if applicable
  price_override: number | null;     // custom price per period (minor unit)
  coupon_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;                // ISO
  updated_at: string | null;         // ISO
};

export type ApiSubscription = Omit<Subscription,
  | "cancel_at_period_end" | "quantity" | "price_override" | "plan"
  | "canceled_at" | "pause_at" | "resume_at" | "next_invoice_date" | "updated_at"
> & {
  cancel_at_period_end: boolean | 0 | 1 | "0" | "1" | string;
  quantity: number | string;
  price_override: number | string | null;
  plan: string | ApiPlan | Plan | null;
  canceled_at: string | null;
  pause_at: string | null;
  resume_at: string | null;
  next_invoice_date: string | null;
  updated_at: string | null;
};

const normalizeSubscription = (s: ApiSubscription): Subscription => ({
  ...s,
  user_email: (s.user_email ?? null) as string | null,
  cancel_at_period_end: toBool(s.cancel_at_period_end),
  quantity: toNumber(s.quantity),
  price_override: s.price_override == null ? null : toNumber(s.price_override),
  plan: s.plan == null ? null : (Array.isArray(s.plan) ? (s.plan as unknown as ApiPlan[])[0] : s.plan as ApiPlan | Plan),
  // If plan is a JSON string, parse and normalize
  ...(typeof s.plan === "string" ? { plan: normalizePlan(tryParse<ApiPlan>(s.plan)) } :
    (s.plan && "amount" in (s.plan as Plan)) ? { plan: normalizePlan(s.plan as unknown as ApiPlan) } :
      s.plan ? { plan: normalizePlan(s.plan as ApiPlan) } : { plan: null }),
  canceled_at: s.canceled_at ? toIso(s.canceled_at) : null,
  pause_at: s.pause_at ? toIso(s.pause_at) : null,
  resume_at: s.resume_at ? toIso(s.resume_at) : null,
  next_invoice_date: s.next_invoice_date ? toIso(s.next_invoice_date) : null,
  metadata: (s.metadata ?? null) as Record<string, unknown> | null,
  updated_at: s.updated_at ? toIso(s.updated_at) : null,
});

export type InvoiceSummary = {
  id: string;
  number: string;
  status: "draft" | "issued" | "overdue" | "paid" | "cancelled";
  total: number;            // minor units
  currency: string;
  issue_date: string;       // ISO
  due_date: string | null;  // ISO
  pdf_url: string | null;
};

export type ApiInvoiceSummary = Omit<InvoiceSummary, "total" | "due_date"> & {
  total: number | string;
  due_date: string | null;
};

const normalizeInvoiceSummary = (i: ApiInvoiceSummary): InvoiceSummary => ({
  ...i,
  total: toNumber(i.total),
  due_date: i.due_date ? toIso(i.due_date) : null,
  pdf_url: (i.pdf_url ?? null) as string | null,
});

export type UsageRecord = {
  id: string;
  subscription_id: string;
  meter: string;                // e.g. "api_calls"
  quantity: number;
  timestamp: string;            // ISO
  metadata?: Record<string, unknown> | null;
};

export type ApiUsageRecord = Omit<UsageRecord, "quantity"> & { quantity: number | string };

const normalizeUsage = (u: ApiUsageRecord): UsageRecord => ({
  ...u,
  quantity: toNumber(u.quantity),
});

export type ListParams = {
  q?: string; // user/email/plan search
  status?: SubscriptionStatus;
  user_id?: string; plan_id?: string;
  created_from?: string; created_to?: string; // ISO
  period_end_from?: string; period_end_to?: string; // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "current_period_end" | "status" | "user";
  order?: "asc" | "desc";
};

export type PauseBody = { resume_at?: string | null; reason?: string | null };
export type CancelBody = { at_period_end?: boolean | 0 | 1 | "0" | "1"; reason?: string | null };
export type ChangePlanBody = { plan_id: string; proration_behavior?: "none" | "create_prorations" | "always_invoice"; pay_immediately?: boolean };
export type AddUsageBody = { meter: string; quantity: number; timestamp?: string | null; metadata?: Record<string, unknown> | null };
export type RetryPaymentBody = { reason?: string | null };

export type ExportParams = ListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

export type EventsParams = { id: string; limit?: number; offset?: number };
export type SubscriptionEvent = { id: string; subscription_id: string; event_type: string; message: string; payload?: Record<string, unknown> | null; created_at: string };

export const subscriptionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSubscriptionsAdmin: b.query<Subscription[], ListParams | void>({
      query: (params) => ({ url: "/subscriptions", params }),
      transformResponse: (res: unknown): Subscription[] => {
        if (Array.isArray(res)) return (res as ApiSubscription[]).map(normalizeSubscription);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiSubscription[]).map(normalizeSubscription) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((s) => ({ type: "Subscriptions" as const, id: s.id })),
        { type: "Subscriptions" as const, id: "LIST" },
      ] : [{ type: "Subscriptions" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getSubscriptionAdminById: b.query<Subscription, string>({
      query: (id) => ({ url: `/subscriptions/${id}` }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      providesTags: (_r, _e, id) => [{ type: "Subscriptions", id }],
    }),

    pauseSubscriptionAdmin: b.mutation<Subscription, { id: string; body?: PauseBody }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}/pause`, method: "POST", body }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      invalidatesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: arg.id }, { type: "Subscriptions", id: "LIST" }],
    }),

    resumeSubscriptionAdmin: b.mutation<Subscription, string>({
      query: (id) => ({ url: `/subscriptions/${id}/resume`, method: "POST" }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      invalidatesTags: (_r, _e, id) => [{ type: "Subscriptions", id }, { type: "Subscriptions", id: "LIST" }],
    }),

    cancelSubscriptionAdmin: b.mutation<Subscription, { id: string; body?: CancelBody }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}/cancel`, method: "POST", body }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      invalidatesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: arg.id }, { type: "Subscriptions", id: "LIST" }],
    }),

    changePlanSubscriptionAdmin: b.mutation<Subscription, { id: string; body: ChangePlanBody }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}/change-plan`, method: "POST", body }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      invalidatesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: arg.id }, { type: "Subscriptions", id: "LIST" }],
    }),

    retryPaymentSubscriptionAdmin: b.mutation<Subscription, { id: string; body?: RetryPaymentBody }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}/retry-payment`, method: "POST", body }),
      transformResponse: (res: unknown): Subscription => normalizeSubscription(res as ApiSubscription),
      invalidatesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: arg.id }, { type: "Subscriptions", id: "LIST" }],
    }),

    listSubscriptionInvoicesAdmin: b.query<InvoiceSummary[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/subscriptions/${id}/invoices`, params: { limit, offset } }),
      transformResponse: (res: unknown): InvoiceSummary[] => Array.isArray(res) ? (res as ApiInvoiceSummary[]).map(normalizeInvoiceSummary) : [],
      providesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: `INV_${arg.id}` }],
    }),

    listSubscriptionUsageAdmin: b.query<UsageRecord[], { id: string; meter?: string; limit?: number; offset?: number }>({
      query: ({ id, meter, limit, offset }) => ({ url: `/subscriptions/${id}/usage`, params: { meter, limit, offset } }),
      transformResponse: (res: unknown): UsageRecord[] => Array.isArray(res) ? (res as ApiUsageRecord[]).map(normalizeUsage) : [],
      providesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: `USG_${arg.id}` }],
    }),

    addSubscriptionUsageAdmin: b.mutation<UsageRecord, { id: string; body: AddUsageBody }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}/usage`, method: "POST", body }),
      transformResponse: (res: unknown): UsageRecord => normalizeUsage(res as ApiUsageRecord),
      invalidatesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: `USG_${arg.id}` }],
    }),

    listSubscriptionEventsAdmin: b.query<SubscriptionEvent[], EventsParams>({
      query: ({ id, limit, offset }) => ({ url: `/subscriptions/${id}/events`, params: { limit, offset } }),
      transformResponse: (res: unknown): SubscriptionEvent[] => Array.isArray(res) ? (res as SubscriptionEvent[]) : [],
      providesTags: (_r, _e, arg) => [{ type: "Subscriptions", id: `EVT_${arg.id}` }],
    }),

    exportSubscriptionsAdmin: b.mutation<ExportResponse, ExportParams | void>({
      query: (params) => ({ url: `/subscriptions/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSubscriptionsAdminQuery,
  useGetSubscriptionAdminByIdQuery,
  usePauseSubscriptionAdminMutation,
  useResumeSubscriptionAdminMutation,
  useCancelSubscriptionAdminMutation,
  useChangePlanSubscriptionAdminMutation,
  useRetryPaymentSubscriptionAdminMutation,
  useListSubscriptionInvoicesAdminQuery,
  useListSubscriptionUsageAdminQuery,
  useAddSubscriptionUsageAdminMutation,
  useListSubscriptionEventsAdminQuery,
  useExportSubscriptionsAdminMutation,
} = subscriptionsAdminApi;