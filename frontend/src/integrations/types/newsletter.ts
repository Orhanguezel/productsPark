// ===================================================================
// FILE: src/integrations/types/newsletter.ts
// FINAL — Newsletter types + helpers + normalizers + query/body mappers
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu
// ===================================================================

/* -------------------- shared primitives -------------------- */

import { QueryParams, BoolLike, JsonObject, toBool } from '@/integrations/types';

/* -------------------- PUBLIC types -------------------- */

export type NewsletterPublicSubscribeBody = {
  email: string;
  meta?: JsonObject;
};

export type NewsletterPublicUnsubscribeBody = {
  email: string;
};

export type NewsletterPublicSubscriber = {
  id: string;
  email: string;

  is_verified: boolean;
  meta: JsonObject | null;

  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;

  // legacy aliases (if backend sends)
  subscribeDate?: string;
  unsubscribeDate?: string | null;
};

export type NewsletterUnsubscribeResp = { ok: true };

/* -------------------- ADMIN types -------------------- */

export type NewsletterAdminListParams = {
  q?: string;
  email?: string;

  verified?: BoolLike; // is_verified
  subscribed?: BoolLike; // true => unsubscribed_at is null

  limit?: number;
  offset?: number;

  orderBy?: 'created_at' | 'updated_at' | 'email' | 'verified';
  order?: 'asc' | 'desc';
};

export type NewsletterAdminUpdateBody = {
  verified?: BoolLike;
  subscribed?: BoolLike; // true => active, false => unsubscribed
  meta?: JsonObject | null;
};

export type NewsletterAdminSubscriber = {
  id: string;
  email: string;

  is_verified: boolean;
  is_subscribed: boolean;

  meta: JsonObject | null;

  created_at: string;
  updated_at: string;
  unsubscribed_at: string | null;
};

export type NewsletterAdminListResp = {
  data: NewsletterAdminSubscriber[];
  meta: { total: number | null; limit: number | null; offset: number | null };
};

/* -------------------- helpers -------------------- */

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
};

const toTrimStr = (v: unknown): string => toStr(v).trim();



const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * unknown -> BoolLike daraltma (BoolLike union'una %100 uyumlu)
 * - union DIŞI değerleri 'true'|'false'/'0'|'1' gibi union içi değerlere map'ler
 * - map edilemeyenler -> undefined (fallback'e düşer)
 */
function asBoolLike(x: unknown): BoolLike {
  if (x == null) return x; // null | undefined
  if (typeof x === 'boolean') return x;
  if (x === 0 || x === 1) return x;

  if (typeof x === 'number') {
    // union dışı sayılar: doğrudan BoolLike değil => undefined
    return undefined;
  }

  if (typeof x === 'string') {
    const s = x.trim().toLowerCase();

    // union içinde olanlar
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;

    // union DIŞI ama sık gelen değerler -> union İÇİNE map
    if (s === 'yes' || s === 'y' || s === 'on' || s === 'active' || s === 'enabled') return 'true';
    if (s === 'no' || s === 'n' || s === 'off' || s === 'inactive' || s === 'disabled')
      return 'false';
  }

  return undefined;
}

function clamp(n: number, min = 1, max = 200): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function pickFirst(src: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
}

function pickOptStr(src: Record<string, unknown>, keys: readonly string[]): string | null {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : null;
}

function pickStr(src: Record<string, unknown>, keys: readonly string[], fallback = ''): string {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : fallback;
}

function pickIsoOrNull(src: Record<string, unknown>, keys: readonly string[]): string | null {
  const s = pickOptStr(src, keys);
  return s ? s : null;
}

function normalizeMeta(v: unknown): JsonObject | null {
  if (!v) return null;
  if (isPlainObject(v)) return v;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // sadece JSON object kabul edelim (array gelirse null)
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const parsed: unknown = JSON.parse(s);
        return isPlainObject(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
  }

  return null;
}

function extractArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isPlainObject(res)) {
    const data = res['data'];
    if (Array.isArray(data)) return data;
  }
  return [];
}

/* -------------------- normalizers -------------------- */

export function normalizeNewsletterPublicSubscriber(res: unknown): NewsletterPublicSubscriber {
  const r: Record<string, unknown> = isPlainObject(res) ? res : {};

  const created_at = pickStr(r, ['created_at', 'createdAt'], '');
  const updated_at = pickStr(r, ['updated_at', 'updatedAt'], '');

  const verifiedLike = asBoolLike(pickFirst(r, ['is_verified', 'verified']));

  const subscribeDate = pickOptStr(r, ['subscribeDate']);
  const hasUnsubscribeDate = pickFirst(r, ['unsubscribeDate']) != null;

  return {
    id: pickStr(r, ['id'], ''),
    email: pickStr(r, ['email'], ''),

    is_verified: toBool(verifiedLike, false),
    meta: normalizeMeta(pickFirst(r, ['meta'])),

    created_at,
    updated_at,
    unsubscribed_at: pickIsoOrNull(r, ['unsubscribed_at', 'unsubscribedAt', 'unsubscribeDate']),

    ...(subscribeDate ? { subscribeDate } : {}),
    ...(hasUnsubscribeDate ? { unsubscribeDate: pickIsoOrNull(r, ['unsubscribeDate']) } : {}),
  };
}

export function normalizeNewsletterAdminSubscriber(res: unknown): NewsletterAdminSubscriber {
  const r: Record<string, unknown> = isPlainObject(res) ? res : {};

  const verifiedLike = asBoolLike(pickFirst(r, ['is_verified', 'verified']));
  const is_verified = toBool(verifiedLike, false);

  const unsubscribed_at = pickIsoOrNull(r, [
    'unsubscribed_at',
    'unsubscribedAt',
    'unsubscribeDate',
  ]);

  const subscribedRaw = pickFirst(r, ['is_subscribed', 'subscribed']);
  const subscribedLike = asBoolLike(subscribedRaw);

  // is_subscribed varsa onu kullan, yoksa unsubscribed_at null mı -> subscribed
  const is_subscribed =
    subscribedRaw != null ? toBool(subscribedLike, true) : unsubscribed_at == null;

  return {
    id: pickStr(r, ['id'], ''),
    email: pickStr(r, ['email'], ''),

    is_verified,
    is_subscribed,

    meta: normalizeMeta(pickFirst(r, ['meta'])),

    created_at: pickStr(r, ['created_at', 'createdAt'], ''),
    updated_at: pickStr(r, ['updated_at', 'updatedAt'], ''),
    unsubscribed_at,
  };
}

export function normalizeNewsletterAdminList(res: unknown): NewsletterAdminSubscriber[] {
  return extractArray(res).map((x) => normalizeNewsletterAdminSubscriber(x));
}

/* -------------------- query/body mappers -------------------- */

export function toNewsletterSubscribeBody(
  b: NewsletterPublicSubscribeBody,
): Record<string, unknown> {
  const email = toTrimStr(b.email);
  return {
    email,
    ...(typeof b.meta !== 'undefined' ? { meta: b.meta ?? null } : {}),
  };
}

export function toNewsletterUnsubscribeBody(
  b: NewsletterPublicUnsubscribeBody,
): Record<string, unknown> {
  return { email: toTrimStr(b.email) };
}

export function toNewsletterAdminListQuery(
  p?: NewsletterAdminListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};

  if (p.q) out.q = p.q;
  if (p.email) out.email = p.email;

  if (typeof p.verified !== 'undefined') out.verified = toBool(p.verified) ? '1' : '0';
  if (typeof p.subscribed !== 'undefined') out.subscribed = toBool(p.subscribed, true) ? '1' : '0';

  if (typeof p.limit === 'number') out.limit = clamp(p.limit, 1, 200);
  if (typeof p.offset === 'number') out.offset = Math.max(0, Math.trunc(p.offset));

  if (p.orderBy) out.orderBy = p.orderBy;
  if (p.order) out.order = p.order;

  return Object.keys(out).length ? out : undefined;
}

export function toNewsletterAdminUpdateBody(b: NewsletterAdminUpdateBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof b.verified !== 'undefined') out.verified = toBool(b.verified);
  if (typeof b.subscribed !== 'undefined') out.subscribed = toBool(b.subscribed, true);
  if (typeof b.meta !== 'undefined') out.meta = b.meta;

  return out;
}

/** Unsubscribe response -> { ok: true } normalize */
export function normalizeNewsletterUnsubscribeResp(res: unknown): NewsletterUnsubscribeResp {
  const r: Record<string, unknown> = isPlainObject(res) ? res : {};
  const ok = r['ok'];
  if (ok === true || ok === 1 || ok === '1' || ok === 'true') return { ok: true as const };
  return { ok: true as const };
}

/* -------------------- header helpers (admin list total) -------------------- */

export type HeadersLike =
  | { get(name: string): string | null }
  | Record<string, string | undefined>
  | undefined;

export function readTotalFromHeaders(headers: HeadersLike): number | null {
  try {
    if (!headers) return null;

    const raw =
      typeof (headers as { get?: unknown }).get === 'function'
        ? (headers as { get(name: string): string | null }).get('x-total-count')
        : (headers as Record<string, string | undefined>)['x-total-count'];

    if (raw == null) return null;
    const n = Number(String(raw).trim());
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
