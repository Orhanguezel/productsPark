// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_requests.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi_prq } from "../baseApi";

type UnknownRecord = Record<string, unknown>;
const asArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const toNumber = (x: unknown): number => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return Number(x ?? 0);
};

export type PaymentRequestStatus =
  | "pending"
  | "approved"
  | "paid"
  | "failed"
  | "cancelled";

export type PaymentRequest = {
  id: string;
  order_id?: string | null;
  user_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  created_at?: string;
};

export type ApiPaymentRequest = Omit<PaymentRequest, "amount"> & {
  amount: number | string;
};

const normalizeReq = (p: ApiPaymentRequest): PaymentRequest => ({
  ...p,
  amount: toNumber(p.amount),
});

/** ✅ BE create body ile birebir (id/created_at hariç) */
export type CreatePaymentRequestBody = {
  order_id: string;
  user_id?: string | null;
  amount: number | string;
  currency: string;
  payment_method: string;
  payment_proof?: string | null;
  status?: PaymentRequestStatus;
};

export const paymentRequestsApi = baseApi_prq.injectEndpoints({
  endpoints: (b) => ({
    // Liste
    listPaymentRequests: b.query<
      PaymentRequest[],
      {
        user_id?: string;
        order_id?: string;
        status?: PaymentRequestStatus;
        limit?: number;
        offset?: number;
      }
    >({
      query: (params) => ({ url: "/payment_requests", params }),
      transformResponse: (res: unknown): PaymentRequest[] => {
        const arr = asArray<UnknownRecord>(res) as ApiPaymentRequest[];
        return arr.map(normalizeReq);
      },
      providesTags: (result, _e, args) => {
        const base = [{ type: "PaymentRequests" as const, id: "LIST" }];
        const scoped: Array<{ type: "PaymentRequests"; id: string }> = [];
        if (args?.user_id) {
          scoped.push({
            type: "PaymentRequests",
            id: `USER_${args.user_id}`,
          });
        }
        if (args?.order_id) {
          scoped.push({
            type: "PaymentRequests",
            id: `ORDER_${args.order_id}`,
          });
        }
        const rows = result
          ? result.map((r) => ({
              type: "PaymentRequests" as const,
              id: r.id,
            }))
          : [];
        return [...rows, ...scoped, ...base];
      },
    }),

    // ✅ CREATE
    createPaymentRequest: b.mutation<PaymentRequest, CreatePaymentRequestBody>({
      query: (body) => ({
        url: "/payment_requests",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): PaymentRequest =>
        normalizeReq(res as ApiPaymentRequest),
      invalidatesTags: (result) => {
        const base = [{ type: "PaymentRequests" as const, id: "LIST" }];
        if (!result) return base;

        const extra: Array<{ type: "PaymentRequests"; id: string }> = [];
        if (result.user_id) {
          extra.push({
            type: "PaymentRequests",
            id: `USER_${result.user_id}`,
          });
        }
        if (result.order_id) {
          extra.push({
            type: "PaymentRequests",
            id: `ORDER_${result.order_id}`,
          });
        }

        return [
          { type: "PaymentRequests" as const, id: result.id },
          ...extra,
          ...base,
        ];
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentRequestsQuery,
  useCreatePaymentRequestMutation,
} = paymentRequestsApi;
