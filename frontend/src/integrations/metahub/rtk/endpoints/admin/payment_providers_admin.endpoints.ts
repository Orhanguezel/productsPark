// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import {
  PaymentProviderKey,
  PaymentProviderRow as PaymentProviderAdmin,
} from "../../../db/types/payments";
import { normalizePaymentProviderRows } from "../../../db/normalizers/payments";

type ListProvidersParams = { is_active?: 0 | 1 | boolean; q?: string };

export const paymentProvidersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProvidersAdmin: b.query<
      PaymentProviderAdmin[],
      ListProvidersParams | undefined
    >({
      query: (params) => {
        const qs: Record<string, unknown> = {};
        if (params?.is_active !== undefined) qs.is_active = params.is_active;
        if (params?.q) qs.q = params.q;
        return { url: "/admin/payment_providers", params: qs };
      },
      transformResponse: (res: unknown): PaymentProviderAdmin[] =>
        normalizePaymentProviderRows(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "PaymentProvidersAdmin" as const,
                id: p.id,
              })),
              { type: "PaymentProvidersAdmin" as const, id: "LIST" },
            ]
          : [{ type: "PaymentProvidersAdmin" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPaymentProviderAdminById: b.query<PaymentProviderAdmin, string>({
      query: (id) => ({ url: `/admin/payment_providers/${id}` }),
      transformResponse: (res: unknown): PaymentProviderAdmin =>
        (res as PaymentProviderAdmin),
      providesTags: (_r, _e, id) => [{ type: "PaymentProvidersAdmin", id }],
    }),

    createPaymentProviderAdmin: b.mutation<
      PaymentProviderAdmin,
      Partial<PaymentProviderAdmin>
    >({
      query: (body) => ({
        url: "/admin/payment_providers",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): PaymentProviderAdmin =>
        (res as PaymentProviderAdmin),
      invalidatesTags: [{ type: "PaymentProvidersAdmin", id: "LIST" }],
    }),

    updatePaymentProviderAdmin: b.mutation<
      PaymentProviderAdmin,
      { id: string; body: Partial<PaymentProviderAdmin> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/payment_providers/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): PaymentProviderAdmin =>
        (res as PaymentProviderAdmin),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PaymentProvidersAdmin", id: arg.id },
        { type: "PaymentProvidersAdmin", id: "LIST" },
      ],
    }),

    deletePaymentProviderAdmin: b.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/payment_providers/${id}`,
        method: "DELETE",
      }),
      transformResponse: (res: unknown) =>
        (res as { success: boolean }) ?? { success: true },
      invalidatesTags: (_r, _e, id) => [
        { type: "PaymentProvidersAdmin", id },
        { type: "PaymentProvidersAdmin", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentProvidersAdminQuery,
  useGetPaymentProviderAdminByIdQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
  useDeletePaymentProviderAdminMutation,
} = paymentProvidersAdminApi;
