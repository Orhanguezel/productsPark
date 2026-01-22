// ===================================================================
// FILE: src/integrations/types/topbar.ts
// FINAL — Topbar types + helpers + normalizers + query/body mappers
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu
// ===================================================================

/* -------------------- primitives -------------------- */

import type { BoolLike, SortOrder, QueryParams } from '@/integrations/types';
import { toBool,toStr} from '@/integrations/types';

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);



const trimStr = (v: unknown): string => toStr(v).trim();

const optStr = (v: unknown): string | null => {
  const s = trimStr(v);
  return s ? s : null;
};

/**
 * unknown -> BoolLike daraltma
 * normalize aşamasında toBool'a unknown vermemek için.
 */
const asBoolLike = (x: unknown): BoolLike => {
  if (x == null) return x; // null | undefined
  if (typeof x === 'boolean') return x;
  if (x === 0 || x === 1) return x;

  if (typeof x === 'string') {
    const s = x.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false' || s === 'yes' || s === 'no')
      return s as BoolLike;

    if (s === 'on') return 'true';
    if (s === 'off') return 'false';
  }

  return undefined;
};

/* -------------------- domain models -------------------- */

/** FE normalized model (admin + public ortak kullanır) */
export type TopbarSetting = {
  id: string;
  is_active: boolean;
  message: string;

  // kupon
  coupon_code?: string | null;
  coupon_id?: string | null;
  coupon_title?: string | null;
  coupon_content_html?: string | null;

  // link
  link_url?: string | null;
  link_text?: string | null;

  show_ticker?: boolean;

  created_at?: string;
  updated_at?: string;
};

/** Public API row (tolerant) */
export type ApiTopbarPublicRow = {
  id?: unknown;

  is_active?: unknown;

  // bazı BE’ler message, bazıları text döndürebilir
  message?: unknown;
  text?: unknown;

  coupon_code?: unknown;
  coupon_id?: unknown;

  coupon_title?: unknown;
  coupon_content_html?: unknown;

  link_url?: unknown;
  link_text?: unknown;

  // bazı BE’ler link / linkText / linkUrl kullanabilir
  link?: unknown;
  linkUrl?: unknown;
  linkText?: unknown;

  show_ticker?: unknown;

  created_at?: unknown;
  updated_at?: unknown;
};

/** Admin API row (tolerant) */
export type ApiTopbarAdminRow = {
  id?: unknown;

  // admin: text/link alanları
  text?: unknown;
  link?: unknown;

  coupon_id?: unknown;
  coupon_code?: unknown;

  is_active?: unknown;
  show_ticker?: unknown;

  created_at?: unknown;
  updated_at?: unknown;
};

/* -------------------- FE request types -------------------- */

export type TopbarPublicListParams = {
  is_active?: boolean;
  order?: SortOrder; // created_at.asc|desc olacak
  limit?: number;
  offset?: number;
};

export type AdminTopbarListParams = {
  q?: string;
  is_active?: boolean;
  sort?: 'created_at' | 'updated_at' | 'message' | 'is_active';
  order?: SortOrder;
  limit?: number;
  offset?: number;
};

export type UpsertTopbarBody = {
  message: string;

  is_active?: boolean;
  show_ticker?: boolean;

  coupon_id?: string | null;
  coupon_code?: string | null; // legacy compat (FE’de dursun)

  link_url?: string | null;
  link_text?: string | null; // public bazı backend’lerde var, admin’de yok
};

/* -------------------- normalizers -------------------- */

export function normalizeTopbarPublic(row: unknown): TopbarSetting {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const created_at = optStr(r.created_at) ?? undefined;
  const updated_at = optStr(r.updated_at) ?? undefined;

  // message/text variations
  const message = trimStr(r.message ?? r.text ?? '');

  // link variations
  const link_url = optStr(r.link_url ?? r.linkUrl ?? r.link) ?? null;
  const link_text = optStr(r.link_text ?? r.linkText) ?? null;

  return {
    id: trimStr(r.id),
    is_active: toBool(asBoolLike(r.is_active), false),
    message,

    coupon_code: optStr(r.coupon_code) ?? null,
    coupon_id: optStr(r.coupon_id) ?? null,
    coupon_title: optStr(r.coupon_title) ?? null,
    coupon_content_html: optStr(r.coupon_content_html) ?? null,

    link_url,
    link_text,

    show_ticker: toBool(asBoolLike(r.show_ticker), false),

    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeTopbarPublicList(res: unknown): TopbarSetting[] {
  if (Array.isArray(res)) return res.map((x) => normalizeTopbarPublic(x));
  return [];
}

export function normalizeTopbarAdmin(row: unknown): TopbarSetting {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const created_at = optStr(r.created_at) ?? undefined;
  const updated_at = optStr(r.updated_at) ?? undefined;

  // admin: text -> message
  const message = trimStr(r.text ?? r.message ?? '');

  const link_url = optStr(r.link ?? r.link_url ?? r.linkUrl) ?? null;

  return {
    id: trimStr(r.id),
    is_active: toBool(asBoolLike(r.is_active), false),
    message,

    coupon_id: optStr(r.coupon_id) ?? null,
    coupon_code: optStr(r.coupon_code) ?? null,

    link_url,
    // admin listte link_text yok -> null
    link_text: null,

    show_ticker: toBool(asBoolLike(r.show_ticker), false),

    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeTopbarAdminList(res: unknown): TopbarSetting[] {
  if (Array.isArray(res)) return res.map((x) => normalizeTopbarAdmin(x));
  return [];
}

/* -------------------- query/body mappers -------------------- */

export function toTopbarAdminListQuery(p?: AdminTopbarListParams | void): QueryParams | undefined {
  if (!p) return undefined;
  const out: QueryParams = {};

  if (p.q) out.q = p.q;

  if (typeof p.is_active === 'boolean') out.is_active = p.is_active ? '1' : '0';

  if (p.sort) {
    // FE: message, BE: text
    out.sort = p.sort === 'message' ? 'text' : p.sort;
  }
  if (p.order) out.order = p.order;

  if (typeof p.limit === 'number') out.limit = Math.max(1, Math.min(200, p.limit));
  if (typeof p.offset === 'number') out.offset = Math.max(0, p.offset);

  return Object.keys(out).length ? out : undefined;
}

export function toTopbarPublicListQuery(
  p?: TopbarPublicListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;
  const out: QueryParams = {};

  if (typeof p.is_active === 'boolean') out.is_active = p.is_active ? '1' : '0';
  if (p.order) out.order = `created_at.${p.order}`;

  if (typeof p.limit === 'number') out.limit = Math.max(1, Math.min(200, p.limit));
  if (typeof p.offset === 'number') out.offset = Math.max(0, p.offset);

  return Object.keys(out).length ? out : undefined;
}

/**
 * Admin upsert body mapper
 * BE expects: { text, link, is_active, show_ticker, coupon_id }
 */
export function toTopbarAdminUpsertBody(b: UpsertTopbarBody): Record<string, unknown> {
  const text = trimStr(b.message);

  return {
    text,
    link: b.link_url ?? null,
    is_active: !!b.is_active,
    show_ticker: !!b.show_ticker,
    coupon_id: b.coupon_id ?? null,
  };
}
