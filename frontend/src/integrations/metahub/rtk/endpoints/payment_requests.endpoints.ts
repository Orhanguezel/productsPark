
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_requests.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi_prq } from "../baseApi";
const toNumberReq = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type PaymentRequest = {
  id: string;
  order_id?: string | null;
  user_id?: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  created_at?: string;
};

export type ApiPaymentRequest = Omit<PaymentRequest, "amount"> & { amount: number | string };

const normalizeReq = (p: ApiPaymentRequest): PaymentRequest => ({ ...p, amount: toNumberReq(p.amount) });

export const paymentRequestsApi = baseApi_prq.injectEndpoints({
  endpoints: (b) => ({
    listPaymentRequests: b.query<PaymentRequest[], { user_id?: string; order_id?: string; status?: PaymentRequest["status"]; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/payment_requests", params }),
      transformResponse: (res: unknown): PaymentRequest[] => Array.isArray(res) ? (res as ApiPaymentRequest[]).map(normalizeReq) : [],
      providesTags: (result, _e, args) => {
        const base = [{ type: "PaymentRequests" as const, id: "LIST" }];
        const scoped: Array<{ type: "PaymentRequests"; id: string }> = [];
        if (args?.user_id) scoped.push({ type: "PaymentRequests", id: `USER_${args.user_id}` });
        if (args?.order_id) scoped.push({ type: "PaymentRequests", id: `ORDER_${args.order_id}` });
        const rows = result ? result.map((r) => ({ type: "PaymentRequests" as const, id: r.id })) : [];
        return [...rows, ...scoped, ...base];
      },
    }),
  }),
  overrideExisting: true,
});

export const { useListPaymentRequestsQuery } = paymentRequestsApi;
