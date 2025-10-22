// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_sessions.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../baseApi";

const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const tryParse2 = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {} } return x as T; };

export type PaymentSessionStatus = "requires_action" | "pending" | "authorized" | "captured" | "cancelled" | "failed" | "succeeded";

export type PaymentSession = {
  id: string;
  provider_key: string;               // matches PaymentProvider.key
  order_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentSessionStatus;
  client_secret?: string | null;      // stripe
  iframe_url?: string | null;         // payTR, iyzico
  redirect_url?: string | null;       // hosted checkout
  extra?: Record<string, unknown> | null; // provider payload
  created_at?: string;
  updated_at?: string;
};

export type ApiPaymentSession = Omit<PaymentSession, "amount" | "extra"> & { amount: number | string; extra?: string | PaymentSession["extra"] };

const normalizeSession = (s: ApiPaymentSession): PaymentSession => ({ ...s, amount: toNumber(s.amount), extra: s.extra ? tryParse2<PaymentSession["extra"]>(s.extra) : null });

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

export const paymentSessionsApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    createPaymentSession: b.mutation<PaymentSession, CreatePaymentSessionBody>({
      query: (body) => ({ url: "/payment_sessions", method: "POST", body }),
      transformResponse: (res: unknown): PaymentSession => normalizeSession(res as ApiPaymentSession),
      invalidatesTags: [{ type: "PaymentSessions" as const, id: "LIST" }],
    }),

    getPaymentSessionById: b.query<PaymentSession, string>({
      query: (id) => ({ url: `/payment_sessions/${id}` }),
      transformResponse: (res: unknown): PaymentSession => normalizeSession(res as ApiPaymentSession),
      providesTags: (_r, _e, id) => [{ type: "PaymentSession", id }],
    }),

    capturePaymentSession: b.mutation<{ success: boolean; status: PaymentSessionStatus }, { id: string }>({
      query: ({ id }) => ({ url: `/payment_sessions/${id}/capture`, method: "POST" }),
      transformResponse: (res: unknown): { success: boolean; status: PaymentSessionStatus } => (res as { success: boolean; status: PaymentSessionStatus }) ?? { success: true, status: "captured" },
      invalidatesTags: (_r, _e, a) => [{ type: "PaymentSession", id: a.id }],
    }),

    cancelPaymentSession: b.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({ url: `/payment_sessions/${id}/cancel`, method: "POST" }),
      transformResponse: (res: unknown): { success: boolean } => (res as { success: boolean }) ?? { success: true },
      invalidatesTags: (_r, _e, a) => [{ type: "PaymentSession", id: a.id }],
    }),
  }),
  overrideExisting: true,
});

export const { useCreatePaymentSessionMutation, useGetPaymentSessionByIdQuery, useCapturePaymentSessionMutation, useCancelPaymentSessionMutation } = paymentSessionsApi;
