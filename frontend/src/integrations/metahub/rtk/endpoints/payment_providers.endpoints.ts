// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/payment_providers.endpoints.ts
// (PUBLIC) /payment_providers ve /payment_providers/:key
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { PaymentProviderKey, PaymentProviderRow } from "../types/payments";

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

/** Public response (secret_config yok) */
export type PaymentProviderPublic = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;
  public_config: Record<string, unknown>;
  created_at?: string;
  updated_at?: string | null;
};

type ApiProviderPublic = Partial<PaymentProviderRow> & {
  // bazı BE'ler "name" döndürebilir; fallback ekliyoruz
  name?: string;
  is_active?: BoolLike;
  public_config?: unknown;
};

const normalizePublicOne = (r: unknown): PaymentProviderPublic => {
  const row = (r ?? {}) as ApiProviderPublic;

  const displayNameRaw =
    (row as { display_name?: unknown }).display_name ??
    (row as { name?: unknown }).name ??
    "";

  return {
    id: String((row as { id?: unknown }).id ?? ""),
    key: (row as { key?: unknown }).key as PaymentProviderKey,
    display_name: String(displayNameRaw ?? ""),
    is_active: toBool(row.is_active),
    public_config: parseJsonMaybe(row.public_config),
    created_at: (row as { created_at?: string }).created_at,
    updated_at: (row as { updated_at?: string | null }).updated_at ?? null,
  };
};

const normalizePublicMany = (res: unknown): PaymentProviderPublic[] => {
  if (Array.isArray(res)) return res.map(normalizePublicOne);
  if (typeof res === "object" && res !== null) {
    const rec = res as Record<string, unknown>;
    if (Array.isArray(rec.items as unknown[])) {
      return (rec.items as unknown[]).map(normalizePublicOne);
    }
  }
  return [];
};

export const paymentProvidersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPaymentProviders: b.query<PaymentProviderPublic[], void>({
      query: () => ({ url: "/payment_providers" }),
      transformResponse: (res: unknown) => normalizePublicMany(res),
      providesTags: (result) =>
        result
          ? [
            ...result.map((p) => ({ type: "PaymentProviders" as const, id: p.id })),
            { type: "PaymentProviders" as const, id: "LIST" },
          ]
          : [{ type: "PaymentProviders" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getPaymentProviderByKey: b.query<PaymentProviderPublic, string>({
      query: (key) => ({ url: `/payment_providers/${key}` }),
      transformResponse: (res: unknown) => normalizePublicOne(res),
      providesTags: (_r, _e, key) => [{ type: "PaymentProviders", id: `KEY:${key}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPaymentProvidersQuery,
  useGetPaymentProviderByKeyQuery,
} = paymentProvidersApi;
