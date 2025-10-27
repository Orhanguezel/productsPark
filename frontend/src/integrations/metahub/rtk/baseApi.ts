// src/integrations/metahub/rtk/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";
import { metahubTags } from "./tags";
import { tokenStore } from "@/integrations/metahub/core/token";

const RAW =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_METAHUB_URL as string | undefined) ??
  "http://localhost:8081";

const BASE_URL = RAW.replace(/\/$/, "");

/* ----------------- guards & helpers ----------------- */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
type AnyArgs = string | FetchArgs;

function mapPaymentMethod(v: unknown): unknown {
  const s = String(v);
  if (s === "havale" || s === "eft") return "bank_transfer";
  if (s === "paytr_havale") return "paytr";
  return v;
}

interface OrderCompatBody extends Record<string, unknown> {
  payment_method?: unknown;
  items?: unknown;
}

function compatAdjustArgs(args: AnyArgs): AnyArgs {
  if (typeof args === "string") return args;
  const a: FetchArgs = { ...args };

  // GET /profiles?id=UUID&limit=1 -> /profiles/UUID
  if (a.url?.replace(/\/+$/, "") === "/profiles" && (!a.method || a.method.toUpperCase() === "GET")) {
    const params = isRecord(a.params) ? a.params : undefined;
    const id = params && typeof (params ).id === "string" ? (params).id : null;
    const limitIsOne = params ? String((params as Record<string, unknown>).limit) === "1" : false;
    if (id && limitIsOne) {
      a.url = `/profiles/${encodeURIComponent(id)}`;
      if (params) {
        const { id: _id, limit: _limit, select: _select, ...rest } = params as Record<string, unknown>;
        a.params = Object.keys(rest).length ? rest : undefined;
      }
    }
  }

  // Orders POST compat
  if (a.url?.replace(/\/+$/, "") === "/orders" && a.method?.toUpperCase() === "POST" && a.body && isRecord(a.body)) {
    const b: OrderCompatBody = { ...(a.body as Record<string, unknown>) };
    if (typeof b.payment_method !== "undefined") b.payment_method = mapPaymentMethod(b.payment_method);
    if (!Array.isArray(b.items)) b.items = [];
    a.body = b;
  }

  // Payment Requests POST compat
  if (a.url?.replace(/\/+$/, "") === "/payment_requests" && a.method?.toUpperCase() === "POST" && a.body && isRecord(a.body)) {
    const b: Record<string, unknown> = { ...(a.body as Record<string, unknown>) };
    if (typeof b.payment_method !== "undefined") b.payment_method = mapPaymentMethod(b.payment_method);
    a.body = b;
  }

  return a;
}

/* ----------------- Base Query ----------------- */
type RBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  unknown,
  FetchBaseQueryMeta
>;

// Auth endpoint'leri: bearer ekleme + reauth denemesi YOK
const AUTH_SKIP_REAUTH = new Set([
  "/auth/v1/token",
  "/auth/v1/signup",
  "/auth/v1/google",
  "/auth/v1/google/start",
  "/auth/v1/token/refresh",
  "/auth/v1/logout",
]);

function extractPath(u: string) {
  try {
    if (u.startsWith("http://") || u.startsWith("https://")) {
      const url = new URL(u);
      return url.pathname.replace(/\/+$/, "");
    }
    return u.replace(/^https?:\/\/[^/]+/, "").replace(/\/+$/, "");
  } catch {
    return u;
  }
}

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  // x-skip-auth geldiyse bearer enjekte etme
  prepareHeaders: (headers) => {
    if (headers.get("x-skip-auth") === "1") {
      headers.delete("x-skip-auth");
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      return headers;
    }
    const token = tokenStore.get();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    return headers;
  },
  responseHandler: async (response) => {
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) return response.json();
    if (ct.includes("text/")) return response.text();
    try {
      const t = await response.text();
      return t || null;
    } catch {
      return null;
    }
  },
  validateStatus: (response) => response.ok,
}) as RBQ;

/* ----------------- 401 → refresh ve tekrar dene ----------------- */
type RawResult = Awaited<ReturnType<typeof rawBaseQuery>>;

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = compatAdjustArgs(args);

  const path = typeof req === "string" ? req : req.url || "";
  const cleanPath = extractPath(path);

  // JSON body'lerde Content-Type'ı garanti et
  const ensureJson = (fa: FetchArgs) => {
    if (fa.body && isRecord(fa.body)) {
      fa.headers = { ...(fa.headers || {}), "Content-Type": "application/json" };
    }
    return fa;
  };

  // Auth endpoint'lerinde bearer enjekte edilmesin
  if (typeof req !== "string") {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      req.headers = { ...(req.headers || {}), "x-skip-auth": "1" };
    }
    req = ensureJson(req);
  }

  let result: RawResult = await rawBaseQuery(req, api, extra);

  const status = result.error?.status;

  // 401 ise ve bu istek auth endpoint'i DEĞİL ise refresh dene
  if (status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      {
        url: "/auth/v1/token/refresh",
        method: "POST",
        headers: { "x-skip-auth": "1", Accept: "application/json" },
      },
      api,
      extra
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;
      if (access_token) tokenStore.set(access_token);

      // orijinali tekrar dene
      let retry = compatAdjustArgs(args);
      if (typeof retry !== "string") {
        if (AUTH_SKIP_REAUTH.has(cleanPath)) {
          retry.headers = { ...(retry.headers || {}), "x-skip-auth": "1" };
        }
        retry = ensureJson(retry);
      }
      result = await rawBaseQuery(retry, api, extra);
    } else {
      tokenStore.set(null);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "metahubApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: metahubTags,
});

export { rawBaseQuery };
