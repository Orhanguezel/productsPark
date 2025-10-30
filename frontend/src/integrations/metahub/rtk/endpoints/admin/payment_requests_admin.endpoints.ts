// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_requests_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import {
  PaymentRequestRow as PaymentRequestAdmin,
  ApiPaymentRequestRow as ApiPaymentRequestAdmin,
} from "../../../db/types/payments";
import {
  normalizePaymentRequestRow,
  normalizePaymentRequestRows,
} from "../../../db/normalizers/payments";

export type ListAdminParams = {
  user_id?: string;
  order_id?: string;
  status?: PaymentRequestAdmin["status"];
  limit?: number;
  offset?: number;
  q?: string;
  include?: Array<"order" | "items">;
};

const toFetchParams = (p?: ListAdminParams): Record<string, unknown> =>
  !p
    ? {}
    : {
        user_id: p.user_id,
        order_id: p.order_id,
        status: p.status,
        limit: p.limit,
        offset: p.offset,
        q: p.q,
        include: p.include && p.include.length ? p.include.join(",") : undefined,
      };

export const paymentRequestsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentRequestsAdmin: b.query<
      PaymentRequestAdmin[],
      ListAdminParams | undefined
    >({
      query: (params) => ({
        url: "/admin/payment_requests",
        params: toFetchParams(params),
      }),
      transformResponse: (res: unknown): PaymentRequestAdmin[] =>
        normalizePaymentRequestRows(res),
      providesTags: (result, _e, args) => {
        const base = [{ type: "PaymentRequestsAdmin" as const, id: "LIST" }];
        const scoped: Array<{ type: "PaymentRequestsAdmin"; id: string }> = [];
        if (args?.user_id)
          scoped.push({
            type: "PaymentRequestsAdmin",
            id: `USER_${args.user_id}`,
          });
        if (args?.order_id)
          scoped.push({
            type: "PaymentRequestsAdmin",
            id: `ORDER_${args.order_id}`,
          });
        const rows = result
          ? result.map((r) => ({
              type: "PaymentRequestsAdmin" as const,
              id: r.id,
            }))
          : [];
        return [...rows, ...scoped, ...base];
      },
      keepUnusedDataFor: 60,
    }),

    getPaymentRequestAdminById: b.query<PaymentRequestAdmin, string>({
      query: (id) => ({ url: `/admin/payment_requests/${id}` }),
      transformResponse: (res: unknown): PaymentRequestAdmin =>
        normalizePaymentRequestRow(res as ApiPaymentRequestAdmin),
      providesTags: (_r, _e, id) => [{ type: "PaymentRequestsAdmin", id }],
    }),

    updatePaymentRequestAdmin: b.mutation<
      PaymentRequestAdmin,
      { id: string; body: Partial<Pick<PaymentRequestAdmin, "status" | "admin_note">> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/payment_requests/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): PaymentRequestAdmin =>
        normalizePaymentRequestRow(res as ApiPaymentRequestAdmin),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PaymentRequestsAdmin", id: arg.id },
        { type: "PaymentRequestsAdmin", id: "LIST" },
      ],
    }),

    setPaymentRequestStatusAdmin: b.mutation<
      PaymentRequestAdmin,
      { id: string; status: PaymentRequestAdmin["status"]; admin_note?: string | null }
    >({
      query: ({ id, status, admin_note }) => ({
        url: `/admin/payment_requests/${id}/status`,
        method: "PATCH",
        body: { status, admin_note },
      }),
      transformResponse: (res: unknown): PaymentRequestAdmin =>
        normalizePaymentRequestRow(res as ApiPaymentRequestAdmin),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PaymentRequestsAdmin", id: arg.id },
        { type: "PaymentRequestsAdmin", id: "LIST" },
      ],
    }),

    deletePaymentRequestAdmin: b.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/payment_requests/${id}`,
        method: "DELETE",
      }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean }) ?? { success: true },
      invalidatesTags: (_r, _e, id) => [
        { type: "PaymentRequestsAdmin", id },
        { type: "PaymentRequestsAdmin", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentRequestsAdminQuery,
  useGetPaymentRequestAdminByIdQuery,
  useUpdatePaymentRequestAdminMutation,
  useSetPaymentRequestStatusAdminMutation,
  useDeletePaymentRequestAdminMutation,
} = paymentRequestsAdminApi;
