// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_sessions.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../baseApi";

type UnknownRecord = Record<string, unknown>;
const toNumber = (x: unknown): number => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return Number(x ?? 0);
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* noop */ }
  }
  return x as T;
};

export type PaymentSessionStatus =
  | "requires_action"
  | "pending"
  | "authorized"
  | "captured"
  | "cancelled"
  | "failed"
  | "succeeded";

export type PaymentSession = {
  id: string;
  provider_key: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentSessionStatus;
  client_secret?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;
  extra?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiPaymentSession = Omit<PaymentSession, "amount" | "extra"> & {
  amount: number | string;
  extra?: string | PaymentSession["extra"];
};

const normalizeSession = (s: ApiPaymentSession): PaymentSession => ({
  ...s,
  amount: toNumber(s.amount),
  extra: s.extra ? tryParse<PaymentSession["extra"]>(s.extra) : null,
});

/** ✅ BE create body ile birebir */
export type CreatePaymentSessionBody = {
  provider_key: string;
  order_id?: string;
  amount: number | string;
  currency: string;
  success_url?: string;
  cancel_url?: string;
  return_url?: string;
  customer?: { id?: string; email?: string; name?: string };
  meta?: Record<string, unknown>;
};

/** ✅ Geriye dönük uyumluluk (facade `CreateSessionBody` bekliyordu) */
export type CreateSessionBody = CreatePaymentSessionBody;

export const paymentSessionsApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    createPaymentSession: b.mutation<PaymentSession, CreatePaymentSessionBody>({
      query: (body) => ({ url: "/payment_sessions", method: "POST", body }),
      transformResponse: (res: unknown): PaymentSession =>
        normalizeSession(res as ApiPaymentSession),
      invalidatesTags: [{ type: "PaymentSessions" as const, id: "LIST" }],
    }),

    getPaymentSessionById: b.query<PaymentSession, string>({
      query: (id) => ({ url: `/payment_sessions/${id}` }),
      transformResponse: (res: unknown): PaymentSession =>
        normalizeSession(res as ApiPaymentSession),
      providesTags: (_r, _e, id) => [{ type: "PaymentSession", id }],
    }),

    capturePaymentSession: b.mutation<
      { success: boolean; status: PaymentSessionStatus },
      { id: string }
    >({
      query: ({ id }) => ({ url: `/payment_sessions/${id}/capture`, method: "POST" }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean; status: PaymentSessionStatus }) ?? { success: true, status: "captured" },
      invalidatesTags: (_r, _e, a) => [{ type: "PaymentSession", id: a.id }],
    }),

    cancelPaymentSession: b.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({ url: `/payment_sessions/${id}/cancel`, method: "POST" }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean }) ?? { success: true },
      invalidatesTags: (_r, _e, a) => [{ type: "PaymentSession", id: a.id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreatePaymentSessionMutation,
  useGetPaymentSessionByIdQuery,
  useCapturePaymentSessionMutation,
  useCancelPaymentSessionMutation,
} = paymentSessionsApi;
