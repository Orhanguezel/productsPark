// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payments_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import {
  PaymentStatus,
  PaymentRow as PaymentAdmin,
  ApiPaymentRow as ApiPayment,
  PaymentEventRow as PaymentEvent,
} from "../../types/payments";
import {
  normalizePaymentRow,
  normalizePaymentRows,
} from "../../../db/normalizers/payments";

export type ListParams = {
  q?: string;
  provider?: string;
  status?: PaymentStatus;
  order_id?: string;
  is_test?: boolean;
  min_amount?: number;
  max_amount?: number;
  starts_at?: string;
  ends_at?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "amount_captured" | "amount_authorized" | "status";
  order?: "asc" | "desc";
  include?: Array<"order">;
};

export type CaptureBody = { amount?: number | null; idempotency_key?: string | null };
export type RefundBody = { amount?: number | null; reason?: string | null };
export type VoidBody = { reason?: string | null };

const toFetchParams = (
  p: ListParams
): Record<string, string | number | boolean | undefined> => ({
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
});

export const paymentsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentsAdmin: b.query<PaymentAdmin[], ListParams | undefined>({
      query: (params) => {
        const args: {
          url: string;
          params?: Record<string, string | number | boolean | undefined>;
        } = { url: "/admin/payments" };
        if (params) args.params = toFetchParams(params);
        return args;
      },
      transformResponse: (res: unknown): PaymentAdmin[] =>
        normalizePaymentRows(res),
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
      query: (id) => ({ url: `/admin/payments/${id}` }),
      transformResponse: (res: unknown): PaymentAdmin =>
        normalizePaymentRow(res as ApiPayment),
      providesTags: (_r, _e, id) => [{ type: "Payments", id }],
    }),

    capturePaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: CaptureBody }>(
      {
        query: ({ id, body }) => ({
          url: `/admin/payments/${id}/capture`,
          method: "POST",
          body,
        }),
        transformResponse: (res: unknown): PaymentAdmin =>
          normalizePaymentRow(res as ApiPayment),
        invalidatesTags: (_r, _e, arg) => [
          { type: "Payments", id: arg.id },
          { type: "Payments", id: "LIST" },
        ],
      }
    ),

    refundPaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: RefundBody }>(
      {
        query: ({ id, body }) => ({
          url: `/admin/payments/${id}/refund`,
          method: "POST",
          body,
        }),
        transformResponse: (res: unknown): PaymentAdmin =>
          normalizePaymentRow(res as ApiPayment),
        invalidatesTags: (_r, _e, arg) => [
          { type: "Payments", id: arg.id },
          { type: "Payments", id: "LIST" },
        ],
      }
    ),

    voidPaymentAdmin: b.mutation<PaymentAdmin, { id: string; body?: VoidBody }>(
      {
        query: ({ id, body }) => ({
          url: `/admin/payments/${id}/void`,
          method: "POST",
          body,
        }),
        transformResponse: (res: unknown): PaymentAdmin =>
          normalizePaymentRow(res as ApiPayment),
        invalidatesTags: (_r, _e, arg) => [
          { type: "Payments", id: arg.id },
          { type: "Payments", id: "LIST" },
        ],
      }
    ),

    syncPaymentAdmin: b.mutation<PaymentAdmin, string>({
      query: (id) => ({ url: `/admin/payments/${id}/sync`, method: "POST" }),
      transformResponse: (res: unknown): PaymentAdmin =>
        normalizePaymentRow(res as ApiPayment),
      invalidatesTags: (_r, _e, id) => [
        { type: "Payments", id },
        { type: "Payments", id: "LIST" },
      ],
    }),

    listPaymentEventsAdmin: b.query<PaymentEvent[], string>({
      query: (id) => ({ url: `/admin/payments/${id}/events` }),
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
