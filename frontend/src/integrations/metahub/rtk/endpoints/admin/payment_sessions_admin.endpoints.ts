// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_sessions_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import {
  PaymentSessionStatus,
  PaymentSessionRow as PaymentSessionAdmin,
  ApiPaymentSessionRow as ApiPaymentSession,
} from "../../../db/types/payments";
import {
  normalizePaymentSessionRow,
  normalizePaymentSessionRows,
} from "../../../db/normalizers/payments";

export type ListSessionsParams = {
  order_id?: string;
  provider_key?: string;
  status?: PaymentSessionStatus;
  limit?: number;
  offset?: number;
  q?: string;
};

export type CreateSessionBody = {
  provider_key: string;
  order_id?: string | null;
  amount: number;
  currency?: string; // default TRY server-side
  extra?: Record<string, unknown> | null;
  client_secret?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;
};

const toFetchParams = (p?: ListSessionsParams): Record<string, unknown> =>
  !p
    ? {}
    : {
        order_id: p.order_id,
        provider_key: p.provider_key,
        status: p.status,
        limit: p.limit,
        offset: p.offset,
        q: p.q,
      };

export const paymentSessionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentSessionsAdmin: b.query<PaymentSessionAdmin[], ListSessionsParams | undefined>({
      query: (params) => ({
        url: "/admin/payment_sessions",
        params: toFetchParams(params),
      }),
      transformResponse: (res: unknown): PaymentSessionAdmin[] =>
        normalizePaymentSessionRows(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "PaymentSessionsAdmin" as const,
                id: p.id,
              })),
              { type: "PaymentSessionsAdmin" as const, id: "LIST" },
            ]
          : [{ type: "PaymentSessionsAdmin" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPaymentSessionAdminById: b.query<PaymentSessionAdmin, string>({
      query: (id) => ({ url: `/admin/payment_sessions/${id}` }),
      transformResponse: (res: unknown): PaymentSessionAdmin =>
        normalizePaymentSessionRow(res as ApiPaymentSession),
      providesTags: (_r, _e, id) => [{ type: "PaymentSessionsAdmin", id }],
    }),

    createPaymentSessionAdmin: b.mutation<
      PaymentSessionAdmin,
      CreateSessionBody
    >({
      query: (body) => ({
        url: `/admin/payment_sessions`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): PaymentSessionAdmin =>
        normalizePaymentSessionRow(res as ApiPaymentSession),
      invalidatesTags: [{ type: "PaymentSessionsAdmin", id: "LIST" }],
    }),

    capturePaymentSessionAdmin: b.mutation<
      { success: boolean; status: PaymentSessionStatus },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/admin/payment_sessions/${id}/capture`,
        method: "POST",
      }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean; status: PaymentSessionStatus }) ?? {
          success: true,
          status: "captured",
        },
      invalidatesTags: (_r, _e, a) => [
        { type: "PaymentSessionsAdmin", id: a.id },
        { type: "PaymentSessionsAdmin", id: "LIST" },
      ],
    }),

    cancelPaymentSessionAdmin: b.mutation<{ success: boolean }, { id: string }>(
      {
        query: ({ id }) => ({
          url: `/admin/payment_sessions/${id}/cancel`,
          method: "POST",
        }),
        transformResponse: (res: unknown) =>
          (res as { success: boolean }) ?? { success: true },
        invalidatesTags: (_r, _e, a) => [
          { type: "PaymentSessionsAdmin", id: a.id },
          { type: "PaymentSessionsAdmin", id: "LIST" },
        ],
      }
    ),

    syncPaymentSessionAdmin: b.mutation<
      { success: boolean; status?: PaymentSessionStatus },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/admin/payment_sessions/${id}/sync`,
        method: "POST",
      }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean; status?: PaymentSessionStatus }) ?? {
          success: true,
        },
      invalidatesTags: (_r, _e, a) => [
        { type: "PaymentSessionsAdmin", id: a.id },
        { type: "PaymentSessionsAdmin", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentSessionsAdminQuery,
  useGetPaymentSessionAdminByIdQuery,
  useCreatePaymentSessionAdminMutation,
  useCapturePaymentSessionAdminMutation,
  useCancelPaymentSessionAdminMutation,
  useSyncPaymentSessionAdminMutation,
} = paymentSessionsAdminApi;
