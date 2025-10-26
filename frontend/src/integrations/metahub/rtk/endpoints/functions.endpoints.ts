// src/integrations/metahub/rtk/endpoints/functions.endpoints.ts
import { baseApi } from "../baseApi";

type UnknownRecord = Record<string, unknown>;

const toPriceString = (x: unknown): string => {
  if (typeof x === "number") return x.toFixed(2);
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  }
  const n = Number(x ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

const toIntKurus = (x: unknown): number => {
  if (typeof x === "number") return Math.round(x * 100);
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Math.round((Number.isFinite(n) ? n : 0) * 100);
  }
  const n = Number(x ?? 0);
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
};

const isPlainObject = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isEmptyObject = (v: unknown): boolean =>
  !isPlainObject(v) || Object.keys(v).length === 0;

const normalizeKeyNames = (o: UnknownRecord): UnknownRecord => {
  const out: UnknownRecord = {};
  for (const [k, v] of Object.entries(o)) {
    switch (k) {
      case "orderId": out.order_id = v; break;
      case "successUrl": out.success_url = v; break;
      case "cancelUrl": out.cancel_url = v; break;
      case "returnUrl": out.return_url = v; break;
      default: out[k] = v;
    }
  }
  return out;
};

const normalizeFnBody = (name: string, body?: unknown): UnknownRecord => {
  const raw = isPlainObject(body) ? { ...body } : {};

  // CustomerInfo'yu sakla (email fallback için)
  const customerInfo = isPlainObject((raw as UnknownRecord).customerInfo)
    ? ((raw as UnknownRecord).customerInfo as UnknownRecord)
    : {};

  // orderData -> top-level merge
  if (isPlainObject((raw as UnknownRecord).orderData)) {
    Object.assign(raw, (raw as UnknownRecord).orderData as UnknownRecord);
    delete (raw as UnknownRecord).orderData;
  }

  const b = normalizeKeyNames(raw);

  // Ortak normalizasyon
  if (b.amount !== undefined) b.amount = toPriceString(b.amount);
  if (typeof b.currency === "string") {
    const c = (b.currency as string).toUpperCase();
    b.currency = c === "TRY" ? "TL" : c;
  }
  if (!b.email && typeof customerInfo.email === "string") {
    b.email = customerInfo.email;
  }
  if (b.customer && !isPlainObject(b.customer)) delete b.customer;
  if (b.meta && !isPlainObject(b.meta)) delete b.meta;

  // PayTR kuruş dönüşümleri
  const isPaytr = name === "paytr-get-token" || name === "paytr-havale-get-token";
  if (isPaytr) {
    if (b.payment_amount !== undefined) {
      b.payment_amount = toIntKurus(b.payment_amount);
    } else if (b.amount !== undefined) {
      b.payment_amount = toIntKurus(b.amount);
      delete b.amount;
    }
    if (b.final_amount !== undefined) {
      b.final_amount = toIntKurus(b.final_amount);
    }
  }

  // Shopier: body doğrudan iletilmeli (items BE’de zorunlu olabilir) → ÖZELLİKLE BOŞALTMA!
  return b;
};

export const functionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    invokeFunction: b.mutation<
      { result: UnknownRecord },
      { name: string; body?: unknown }
    >({
      query: ({ name, body }) => {
        const safeName = name.replace(/_/g, "-").toLowerCase();

        const FN_PREFIX = (
          (import.meta.env.VITE_FUNCTIONS_PREFIX as string | undefined) ||
          "/functions/v1"
        ).replace(/\/+$/, "");

        const normalized = normalizeFnBody(safeName, body);
        const finalBody = isEmptyObject(normalized) ? {} : normalized;

        return {
          url: `${FN_PREFIX}/${encodeURIComponent(safeName)}`,
          method: "POST",
          body: finalBody,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        };
      },

      transformResponse: (res: unknown, _meta, arg): { result: UnknownRecord } => {
        const payload = (res as UnknownRecord) ?? {};
        const name = arg.name.replace(/_/g, "-").toLowerCase();

        if (name === "paytr-get-token" || name === "paytr-havale-get-token") {
          const token = (payload.token as string) || undefined;
          const success =
            typeof payload.success === "boolean" ? payload.success : Boolean(token);
          return {
            result: {
              success,
              token,
              forward_payload: (payload as UnknownRecord).forward_payload ?? null,
              expires_in: (payload as UnknownRecord).expires_in ?? null,
            },
          };
        }

        if (name === "shopier-create-payment") {
          const p = payload as UnknownRecord;
          const form_action =
            (p.form_action as string) ?? "https://example.com/mock-shopier";
          const form_data =
            (p.form_data as UnknownRecord) ??
            (() => {
              try {
                const url = String(p.payment_url ?? "");
                const m = url.match(/[?&]oid=([^&]+)/i);
                return { oid: m?.[1] ?? `SHP_${Date.now()}` };
              } catch {
                return { oid: `SHP_${Date.now()}` };
              }
            })();

          return { result: { success: true, form_action, form_data } };
        }

        return { result: payload };
      },

      invalidatesTags: ["Functions"],
    }),
  }),
  overrideExisting: true,
});

export const { useInvokeFunctionMutation } = functionsApi;
