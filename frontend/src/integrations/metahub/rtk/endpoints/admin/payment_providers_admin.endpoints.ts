// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import { PaymentProviderRow as PaymentProviderAdmin } from "../../types/payments";

type BoolLike = boolean | 0 | 1 | "0" | "1" | "true" | "false" | null | undefined;
const toBool = (v: BoolLike): boolean => {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return Boolean(v);
};

const parseJsonMaybe = <T extends Record<string, unknown> = Record<string, unknown>>(val: unknown): T => {
  if (val == null) return {} as T;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try { return (JSON.parse(val) ?? {}) as T; } catch { return {} as T; }
  }
  return {} as T;
};

type ApiProvider = Partial<PaymentProviderAdmin> & {
  is_active?: BoolLike;
  public_config?: unknown;
  secret_config?: unknown;
};

const normalizeOne = (r: unknown): PaymentProviderAdmin => {
  const row = (r ?? {}) as ApiProvider;
  const base = row as unknown as Omit<PaymentProviderAdmin, "is_active" | "public_config" | "secret_config">;
  return {
    ...base,
    is_active: toBool(row.is_active),
    public_config: parseJsonMaybe(row.public_config),
    secret_config: parseJsonMaybe(row.secret_config),
  };
};

function hasItemsArray(x: unknown): x is { items: unknown[] } {
  return typeof x === "object" && x !== null && Array.isArray((x as Record<string, unknown>).items as unknown[]);
}

const normalizeMany = (res: unknown): PaymentProviderAdmin[] => {
  if (Array.isArray(res)) return res.map(normalizeOne);
  if (hasItemsArray(res)) return ((res as { items: unknown[] }).items).map(normalizeOne);
  return [];
};

type ListProvidersParams = { is_active?: 0 | 1 | boolean; q?: string };

export const paymentProvidersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProvidersAdmin: b.query<PaymentProviderAdmin[], ListProvidersParams | undefined>({
      query: (params) => {
        const qs: Record<string, unknown> = {};
        if (params?.is_active !== undefined) qs.is_active = params.is_active;
        if (params?.q) qs.q = params.q;
        return { url: "/admin/payment_providers", params: qs };
      },
      transformResponse: (res: unknown) => normalizeMany(res),
      providesTags: (result) =>
        result
          ? [
            ...result.map((p) => ({ type: "PaymentProvidersAdmin" as const, id: p.id })),
            { type: "PaymentProvidersAdmin" as const, id: "LIST" },
          ]
          : [{ type: "PaymentProvidersAdmin" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPaymentProviderAdminById: b.query<PaymentProviderAdmin, string>({
      query: (id) => ({ url: `/admin/payment_providers/${id}` }),
      transformResponse: (res: unknown) => normalizeOne(res),
      providesTags: (_r, _e, id) => [{ type: "PaymentProvidersAdmin", id }],
    }),

    createPaymentProviderAdmin: b.mutation<PaymentProviderAdmin, Partial<PaymentProviderAdmin>>({
      query: (body) => ({ url: "/admin/payment_providers", method: "POST", body }),
      transformResponse: (res: unknown) => normalizeOne(res),
      invalidatesTags: [{ type: "PaymentProvidersAdmin", id: "LIST" }],
    }),

    updatePaymentProviderAdmin: b.mutation<PaymentProviderAdmin, { id: string; body: Partial<PaymentProviderAdmin> }>({
      query: ({ id, body }) => ({ url: `/admin/payment_providers/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeOne(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "PaymentProvidersAdmin", id: arg.id },
        { type: "PaymentProvidersAdmin", id: "LIST" },
      ],
    }),

    deletePaymentProviderAdmin: b.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/admin/payment_providers/${id}`, method: "DELETE" }),
      transformResponse: (res: unknown) => {
        const ok =
          typeof res === "object" &&
            res !== null &&
            typeof (res as Record<string, unknown>).success === "boolean"
            ? (res as Record<string, unknown>).success
            : true;
        return { success: ok as boolean };
      },
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
