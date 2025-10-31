// =============================================================
// FILE: src/integrations/metahub/rtk/baseApi.ts
// =============================================================
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";
import { metahubTags } from "./tags";
import { tokenStore } from "@/integrations/metahub/core/token";
import { BASE_URL as DB_BASE_URL } from "@/integrations/metahub/db/from/constants";

/** ---------- Base URL resolve (constants.ts'tan) ---------- */
function trimSlash(x: string) {
  return x.replace(/\/+$/, "");
}
function guessDevBackend(): string {
  try {
    const loc = typeof window !== "undefined" ? window.location : null;
    const host = loc?.hostname || "localhost";
    const proto = loc?.protocol || "http:";
    return `${proto}//${host}:8081`;
  } catch {
    return "http://localhost:8081";
  }
}
// constants.ts boş bırakılırsa: DEV→8081, PROD→/api
const BASE_URL = trimSlash(DB_BASE_URL || (import.meta.env.DEV ? guessDevBackend() : "/api"));

/** ---------- helpers & guards ---------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
type AnyArgs = string | FetchArgs;

function isJsonLikeBody(b: unknown): b is Record<string, unknown> {
  if (typeof FormData !== "undefined" && b instanceof FormData) return false;
  if (typeof Blob !== "undefined" && b instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && b instanceof ArrayBuffer) return false;
  return isRecord(b);
}

function mapPaymentMethod(v: unknown): unknown {
  const s = String(v ?? "");
  if (s === "havale" || s === "eft") return "bank_transfer";
  if (s === "paytr_havale") return "paytr";
  return v;
}

interface OrderCompatBody extends Record<string, unknown> {
  payment_method?: unknown;
  items?: unknown;
}

/** İstekleri BE uyumluluğuna göre hafifçe ayarla */
function compatAdjustArgs(args: AnyArgs): AnyArgs {
  if (typeof args === "string") return args;
  const a: FetchArgs = { ...args };

  const urlNoSlash = (a.url ?? "").replace(/\/+$/, "");
  const isGet = !a.method || a.method.toUpperCase() === "GET";

  // GET /profiles?id=UUID&limit=1 -> /profiles/UUID
  if (urlNoSlash === "/profiles" && isGet) {
    const params = isRecord(a.params) ? (a.params as Record<string, unknown>) : undefined;
    const id = typeof params?.id === "string" ? params.id : null;
    const limitIsOne = params ? String(params.limit) === "1" : false;
    if (id && limitIsOne) {
      a.url = `/profiles/${encodeURIComponent(id)}`;
      if (params) {
        const { id: _id, limit: _limit, select: _select, ...rest } = params;
        a.params = Object.keys(rest).length ? rest : undefined;
      }
    }
  }

  // Orders POST compat
  if (urlNoSlash === "/orders" && a.method?.toUpperCase() === "POST" && isRecord(a.body)) {
    const b: OrderCompatBody = { ...(a.body as Record<string, unknown>) };
    if (typeof b.payment_method !== "undefined") b.payment_method = mapPaymentMethod(b.payment_method);
    if (!Array.isArray(b.items)) b.items = [];
    a.body = b;
  }

  // Payment Requests POST compat
  if (urlNoSlash === "/payment_requests" && a.method?.toUpperCase() === "POST" && isRecord(a.body)) {
    const b: Record<string, unknown> = { ...(a.body as Record<string, unknown>) };
    if (typeof b.payment_method !== "undefined") b.payment_method = mapPaymentMethod(b.payment_method);
    a.body = b;
  }

  return a;
}

/** ---------- Base Query ---------- */
type RBQ = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, unknown, FetchBaseQueryMeta>;

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    // auth atlama
    if (headers.get("x-skip-auth") === "1") {
      headers.delete("x-skip-auth");
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      if (!headers.has("Accept-Language")) {
        const lang =
          (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined) ??
          (typeof navigator !== "undefined" ? navigator.language : "tr");
        headers.set("Accept-Language", lang || "tr");
      }
      return headers;
    }

    const token = tokenStore.get();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("Accept-Language")) {
      const lang =
        (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined) ??
        (typeof navigator !== "undefined" ? navigator.language : "tr");
      headers.set("Accept-Language", lang || "tr");
    }
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
  validateStatus: (res) => res.ok,
}) as RBQ;

/** ---------- 401 → refresh → retry ---------- */
type RawResult = Awaited<ReturnType<typeof rawBaseQuery>>;

const AUTH_SKIP_REAUTH = new Set<string>([
  "/auth/v1/token",
  "/auth/v1/signup",
  "/auth/v1/google",
  "/auth/v1/google/start",
  "/auth/v1/token/refresh",
  "/auth/v1/logout",
]);

function extractPath(u: string): string {
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      return url.pathname.replace(/\/+$/, "");
    }
    return u.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "");
  } catch {
    return u.replace(/\/+$/, "");
  }
}

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = compatAdjustArgs(args);
  const path = typeof req === "string" ? req : req.url || "";
  const cleanPath = extractPath(path);

  const ensureJson = (fa: FetchArgs) => {
    if (isJsonLikeBody(fa.body)) {
      fa.headers = { ...(fa.headers || {}), "Content-Type": "application/json" };
    }
    return fa;
  };

  if (typeof req !== "string") {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      req.headers = { ...(req.headers || {}), "x-skip-auth": "1" };
    }
    req = ensureJson(req);
  }

  let result: RawResult = await rawBaseQuery(req, api, extra);

  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      { url: "/auth/v1/token/refresh", method: "POST", headers: { "x-skip-auth": "1", Accept: "application/json" } },
      api,
      extra
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;
      if (access_token) tokenStore.set(access_token);

      let retry: AnyArgs = compatAdjustArgs(args);
      if (typeof retry !== "string") {
        if (AUTH_SKIP_REAUTH.has(cleanPath)) retry.headers = { ...(retry.headers || {}), "x-skip-auth": "1" };
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
