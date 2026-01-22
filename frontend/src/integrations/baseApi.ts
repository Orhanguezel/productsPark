// =============================================================
// FILE: src/integrations/baseApi.ts
// FINAL — RTK baseApi (Vite, strict, token+refresh, cookie-safe)
// =============================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';

import { tags } from './tags';
import { tokenStore } from '@/integrations/core/token';
import { API_URL, API_BASE } from '@/integrations/constants';

/* -------------------- Env helpers (no-any) -------------------- */

type ViteEnvLike = Record<string, string | boolean | undefined>;

function getEnvString(key: string): string {
  const env = import.meta.env as unknown as ViteEnvLike;
  const v = env[key];
  return typeof v === 'string' ? v.trim() : '';
}

function getDefaultLocale(): string {
  const envLocale = getEnvString('VITE_DEFAULT_LOCALE');
  if (envLocale) return envLocale;

  if (typeof navigator !== 'undefined') {
    return (navigator.language || 'tr').trim() || 'tr';
  }
  return 'tr';
}

const DEBUG_API = getEnvString('VITE_DEBUG_API') === '1';
if (DEBUG_API) {
  // eslint-disable-next-line no-console
  console.info('[productspark] API_URL =', API_URL);
}

/* -------------------- Guards -------------------- */

type AnyArgs = string | FetchArgs;

function isAbsUrl(x: string) {
  return /^https?:\/\//i.test(x);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

type AppendLike = { append: (...args: unknown[]) => unknown };

function isProbablyFormData(b: unknown): b is AppendLike {
  if (!b || typeof b !== 'object') return false;
  const maybe = b as Partial<AppendLike>;
  return typeof maybe.append === 'function';
}

function isJsonLikeBody(b: unknown): b is Record<string, unknown> {
  if (typeof FormData !== 'undefined' && b instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && b instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && b instanceof ArrayBuffer) return false;
  if (isProbablyFormData(b)) return false;
  return isRecord(b);
}

/**
 * Normalize path for skip checks.
 * Examples:
 *  - http://localhost:8081/api/auth/logout  -> /auth/logout
 *  - /api/auth/logout                      -> /auth/logout
 *  - /auth/logout                          -> /auth/logout
 */
function normalizeApiPath(u: string): string {
  let p = u;
  try {
    if (isAbsUrl(u)) p = new URL(u).pathname || u;
  } catch {
    // ignore
  }
  p = p.replace(/\/+$/, '') || '/';

  // remove API_BASE prefix if present (default: /api)
  const base = (API_BASE || '/api').replace(/\/+$/, '');
  if (base && p === base) return '/';
  if (base && p.startsWith(base + '/')) return p.slice(base.length) || '/';

  return p.startsWith('/') ? p : `/${p}`;
}

/** relative url normalize */
function normalizeUrlArg(arg: AnyArgs): AnyArgs {
  if (typeof arg === 'string') {
    if (isAbsUrl(arg) || arg.startsWith('/')) return arg;
    return `/${arg}`;
  }
  const url = arg.url ?? '';
  if (url && !isAbsUrl(url) && !url.startsWith('/')) {
    return { ...arg, url: `/${url}` };
  }
  return arg;
}

/* -------------------- LocalStorage safe helpers -------------------- */

function safeGetLocalStorageItem(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSetLocalStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveLocalStorageItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* -------------------- Body header normalization -------------------- */

function ensureProperHeaders(fa: FetchArgs): FetchArgs {
  const next: FetchArgs = { ...fa };
  const hdr = (next.headers as Record<string, string> | undefined) ?? {};

  // Only force JSON when body is a plain object
  if (isJsonLikeBody(next.body)) {
    if (!hdr['Content-Type'] && !hdr['content-type']) {
      next.headers = { ...hdr, 'Content-Type': 'application/json' };
    }
    return next;
  }

  // For FormData/Blob etc remove content-type so browser sets boundary
  if (hdr['Content-Type'] || hdr['content-type']) {
    const { ['Content-Type']: _omit1, ['content-type']: _omit2, ...rest } = hdr;
    next.headers = rest;
  }

  return next;
}

/* -------------------- Skip list -------------------- */

const AUTH_SKIP_REAUTH = new Set<string>([
  '/auth/token',
  '/auth/signup',
  '/auth/google',
  '/auth/google/start',
  '/auth/token/refresh',
  '/auth/logout',
]);

/* -------------------- Base Query -------------------- */

type RBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  unknown,
  FetchBaseQueryMeta
>;

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: API_URL, // includes /api
  credentials: 'include',
  prepareHeaders: (headers) => {
    // x-skip-auth → Authorization ekleme
    if (headers.get('x-skip-auth') === '1') {
      headers.delete('x-skip-auth');
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());
      return headers;
    }

    // Bearer token (optional)
    const token = tokenStore.get() || safeGetLocalStorageItem('mh_access_token');
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());

    return headers;
  },

  responseHandler: async (response) => {
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) return response.json();
    if (ct.includes('text/')) return response.text();

    try {
      const t = await response.text();
      return t || null;
    } catch {
      return null;
    }
  },

  validateStatus: (res) => res.ok,
}) as RBQ;

/* -------------------- Error serialization -------------------- */

function hasError(x: unknown): x is { error: FetchBaseQueryError } {
  return typeof x === 'object' && x !== null && 'error' in x;
}

function getErrorData(err: FetchBaseQueryError): unknown {
  return (err as { data?: unknown }).data;
}

function setErrorData(err: FetchBaseQueryError, data: unknown): FetchBaseQueryError {
  return { ...(err as object), data } as FetchBaseQueryError;
}

async function coerceSerializableError(
  result: Awaited<ReturnType<typeof rawBaseQuery>>,
): Promise<Awaited<ReturnType<typeof rawBaseQuery>>> {
  if (!hasError(result) || !result.error) return result;

  const err = result.error;
  const data = getErrorData(err);

  try {
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      const text = await data.text().catch(() => '');
      const nextErr = setErrorData(
        err,
        text || `[binary ${data.type || 'unknown'} ${data.size ?? ''}B]`,
      );
      return { ...result, error: nextErr };
    }

    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      const dec = new TextDecoder();
      const nextErr = setErrorData(err, dec.decode(new Uint8Array(data)));
      return { ...result, error: nextErr };
    }
  } catch {
    const nextErr = setErrorData(err, String(data ?? ''));
    return { ...result, error: nextErr };
  }

  return result;
}

/* -------------------- 401 → refresh → retry -------------------- */

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = normalizeUrlArg(args);

  const urlStr = typeof req === 'string' ? req : req.url || '';
  const cleanPath = normalizeApiPath(urlStr);

  // mark skip-auth
  if (typeof req !== 'string') {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      const orig = (req.headers as Record<string, string> | undefined) ?? {};
      req.headers = { ...orig, 'x-skip-auth': '1' };
    }
    req = ensureProperHeaders(req);
  }

  // First request
  let result = await rawBaseQuery(req, api, extra);
  result = await coerceSerializableError(result);

  // 401 → refresh → retry (skip list hariç)
  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      {
        url: '/auth/token/refresh',
        method: 'POST',
        headers: { 'x-skip-auth': '1', Accept: 'application/json' },
      },
      api,
      extra,
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;

      if (access_token) {
        tokenStore.set(access_token);
        safeSetLocalStorageItem('mh_access_token', access_token);

        let retry: AnyArgs = normalizeUrlArg(args);
        if (typeof retry !== 'string') retry = ensureProperHeaders(retry);

        result = await rawBaseQuery(retry, api, extra);
        result = await coerceSerializableError(result);
      } else {
        tokenStore.set(null);
        safeRemoveLocalStorageItem('mh_access_token');
        safeRemoveLocalStorageItem('mh_refresh_token');
      }
    } else {
      tokenStore.set(null);
      safeRemoveLocalStorageItem('mh_access_token');
      safeRemoveLocalStorageItem('mh_refresh_token');
    }
  }

  return result;
};

/* -------------------- API -------------------- */

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: tags,
});

export { rawBaseQuery };
export const BASE_URL = API_URL;
