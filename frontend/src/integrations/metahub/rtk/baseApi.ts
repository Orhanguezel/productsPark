// src/integrations/metahub/rtk/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import { store } from "@/store";
import { setSession, reset as resetSession } from "@/integrations/metahub/rtk/slices/auth/slice";
import type { FetchArgs } from "@reduxjs/toolkit/query"; // tipi RTK'den al
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { metahubTags } from "./tags";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8081";

// ---- Yardımcı tipler ve guardlar

// UI'den gelen JSON body'leri üzerinde güvenli çalışmak için object guard:
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type AnyArgs = string | FetchArgs;

function mapPaymentMethod(v: unknown): unknown {
  const s = String(v);
  if (s === "havale" || s === "eft") return "bank_transfer";
  if (s === "paytr_havale") return "paytr";
  return v; // 'paytr', 'shopier', 'wallet', 'credit_card' zaten uyumlu
}

interface OrderCompatBody extends Record<string, unknown> {
  payment_method?: unknown;
  items?: unknown;
}

function compatAdjustArgs(args: AnyArgs): AnyArgs {
  if (typeof args === "string") return args;

  // Burada args zaten object (FetchArgs); kopyasını al
  const a: FetchArgs = { ...args };

  // ---- Profiles GET compat: /profiles?id=UUID&limit=1 -> /profiles/UUID
  if (
    a.url?.replace(/\/+$/, "") === "/profiles" &&
    (!a.method || a.method.toUpperCase() === "GET")
  ) {
    const params = isRecord(a.params) ? a.params : undefined;
    const id = params && typeof params.id === "string" ? params.id : null;
    const limitIsOne = params ? String((params as Record<string, unknown>).limit) === "1" : false;

    if (id && limitIsOne) {
      a.url = `/profiles/${encodeURIComponent(id)}`;
      if (params) {
        const { id: _id, limit: _limit, select: _select, ...rest } = params as Record<string, unknown>;
        a.params = Object.keys(rest).length ? rest : undefined;
      }
    }
  }

  // ---- Orders POST compat
  if (
    a.url?.replace(/\/+$/, "") === "/orders" &&
    a.method?.toUpperCase() === "POST" &&
    a.body &&
    isRecord(a.body)
  ) {
    const b: OrderCompatBody = { ...(a.body as Record<string, unknown>) };

    if (typeof b.payment_method !== "undefined") {
      b.payment_method = mapPaymentMethod(b.payment_method);
    }

    // BE "items" array bekliyorsa en azından []
    if (!Array.isArray(b.items)) {
      b.items = [];
    }

    a.body = b;
  }

  // ---- Payment Requests POST compat
  if (
    a.url?.replace(/\/+$/, "") === "/payment_requests" &&
    a.method?.toUpperCase() === "POST" &&
    a.body &&
    isRecord(a.body)
  ) {
    const b: Record<string, unknown> = { ...(a.body as Record<string, unknown>) };
    if (typeof b.payment_method !== "undefined") {
      b.payment_method = mapPaymentMethod(b.payment_method);
    }
    a.body = b;
  }

  return a;
}

/**
 * Base query
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const s = (getState() as RootState).auth.session;
    if (s?.accessToken && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${s.accessToken}`);
    }

    const locale =
      (getState() as RootState).auth.locale ||
      (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined);
    if (locale && !headers.has("x-locale")) headers.set("x-locale", locale);

    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("X-Requested-With")) headers.set("X-Requested-With", "fetch");
    return headers;
  },
  responseHandler: async (response) => {
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) return response.json();
    if (ct.includes("text/")) return response.text();
    try {
      const t = await response.text();
      return t ? t : null;
    } catch {
      return null;
    }
  },
  validateStatus: (response) => response.ok,
});

// 401'de refresh → yeniden dene (compat rewrite dahil)
const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extra) => {
  let adj: AnyArgs = compatAdjustArgs(args as AnyArgs);
  let result = await rawBaseQuery(adj, api, extra);

  const status = (result.error as FetchBaseQueryError | undefined)?.status;
  if (status === 401) {
    const refreshRes = await rawBaseQuery(
      { url: "/auth/v1/token/refresh", method: "POST" },
      api,
      extra
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;
      if (access_token) {
        const s = (store.getState() as RootState).auth.session;
        store.dispatch(
          setSession(
            s
              ? { ...s, accessToken: access_token }
              : {
                  accessToken: access_token,
                  refreshToken: undefined,
                  expiresIn: 900,
                  tokenType: "bearer",
                  user: null,
                }
          )
        );
      }
      // Orijinal isteği tekrar denerken yeniden compat uygula
      adj = compatAdjustArgs(args as AnyArgs);
      result = await rawBaseQuery(adj, api, extra);
    } else {
      store.dispatch(resetSession());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "metahubApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  // ayrı dosyadan import
  tagTypes: metahubTags,
});

export { rawBaseQuery };
