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
  public_config?: Record<string, unknown> | null;
};

type UnknownRecord = Record<string, unknown>;
const asArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const asObject = (x: unknown): UnknownRecord =>
  (x && typeof x === "object" ? (x as UnknownRecord) : {});

// ✅ Argüman tipini opsiyonel yapıyoruz (void yerine)
//    ve params’ı Record<string, unknown> olarak normalize ediyoruz.
type ListProvidersParams = { is_active?: 0 | 1 | boolean };

export const paymentProvidersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProviders: b.query<PaymentProvider[], ListProvidersParams | undefined>({
      query: (params?: ListProvidersParams) => {
        const qs: Record<string, unknown> = params ? { is_active: params.is_active } : {};
        return { url: "/payment_providers", params: qs };
      },
      transformResponse: (res: unknown): PaymentProvider[] => {
        const arr = asArray<unknown>(res);
        return arr.map((r) => asObject(r) as unknown as PaymentProvider);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "PaymentProvider" as const, id: p.id })),
              { type: "PaymentProviders" as const, id: "LIST" },
            ]
          : [{ type: "PaymentProviders" as const, id: "LIST" }],
    }),

    getPaymentProviderByKey: b.query<PaymentProvider, PaymentProviderKey>({
      query: (key) => ({ url: `/payment_providers/${key}` }),
      transformResponse: (res: unknown): PaymentProvider =>
        asObject(res) as unknown as PaymentProvider,
      providesTags: (_r, _e, key) => [{ type: "PaymentProvider", id: key }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentProvidersQuery,
  useGetPaymentProviderByKeyQuery,
} = paymentProvidersApi;
