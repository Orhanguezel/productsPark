
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_providers.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";

export type PaymentProviderKey = "stripe" | "paytr" | "iyzico" | string;

export type PaymentProvider = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active?: 0 | 1 | boolean;
  // provider-specific public config (publishable keys etc.)
  public_config?: Record<string, unknown> | null;
};

export const paymentProvidersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProviders: b.query<PaymentProvider[], { is_active?: 0 | 1 | boolean } | void>({
      query: (params) => ({ url: "/payment_providers", params: params ?? {} }),
      transformResponse: (res: unknown): PaymentProvider[] => Array.isArray(res) ? (res as PaymentProvider[]) : [],
      providesTags: (result) => result ? [...result.map((p) => ({ type: "PaymentProvider" as const, id: p.id })), { type: "PaymentProviders" as const, id: "LIST" }] : [{ type: "PaymentProviders" as const, id: "LIST" }],
    }),

    getPaymentProviderByKey: b.query<PaymentProvider, PaymentProviderKey>({
      query: (key) => ({ url: `/payment_providers/${key}` }),
      transformResponse: (res: unknown): PaymentProvider => res as PaymentProvider,
      providesTags: (_r, _e, key) => [{ type: "PaymentProvider", id: key }],
    }),
  }),
  overrideExisting: true,
});

export const { useListPaymentProvidersQuery, useGetPaymentProviderByKeyQuery } = paymentProvidersApi;
