// =============================================================
// FILE: src/integrations/types/coupons.ts
// FINAL — Coupon types + helpers + normalizers + query builders
// exactOptionalPropertyTypes: true uyumlu (created_at/updated_at: string | null)
// =============================================================

import { isUnknownRow } from '@/integrations/types';

/* -------------------- types -------------------- */

export type DiscountType = 'percentage' | 'fixed';

export type ApiCoupon = Record<string, unknown>;

export type Coupon = {
  id: string;
  code: string;

  title: string | null;
  content_html: string | null;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase: number;
  max_discount: number | null;

  is_active: boolean;
  max_uses: number | null;
  used_count: number | null;

  valid_from: string | null; // ISO
  valid_until: string | null; // ISO

  applicable_to: 'all' | 'category' | 'product';
  category_ids: string[] | null;
  product_ids: string[] | null;

  // ✅ exactOptionalPropertyTypes uyumu: undefined yok, null var
  created_at: string | null;
  updated_at: string | null;
};

export type CouponInputBase = {
  code: string;
  title?: string | null;
  content_html?: string | null;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;

  valid_from?: string | null; // ISO
  valid_until?: string | null; // ISO
  is_active?: boolean;

  applicable_to?: 'all' | 'category' | 'product';
  category_ids?: string[] | null;
  product_ids?: string[] | null;
};

export type CreateCouponBody = CouponInputBase;
export type UpdateCouponBody = Partial<CouponInputBase>;

export type CouponListParams = {
  is_active?: boolean | 0 | 1;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
};

/* -------------------- helpers -------------------- */

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v == null) return '';
  try {
    return String(v);
  } catch {
    return '';
  }
}

function toTrimStr(v: unknown): string {
  return toStr(v).trim();
}

function toOptStr(v: unknown): string | null {
  if (v == null) return null;
  const s = toTrimStr(v);
  return s ? s : null;
}

function toNum(v: unknown, d = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function toBool01(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  const s = toStr(v).trim().toLowerCase();
  return s === '1' || s === 'true';
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.valueOf()) ? d.toISOString() : null;
}

function tryParseJsonArrayStrings(v: unknown): string[] | null {
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const x of v) {
      const s = toOptStr(x);
      if (s) out.push(s);
    }
    // Array geldi ama boş ise: [] dön (null değil)
    return out;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // JSON array ise
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const out: string[] = [];
        for (const x of parsed) {
          const t = toOptStr(x);
          if (t) out.push(t);
        }
        return out;
      }
    } catch {
      // fallthrough
    }

    // "a,b,c" toleransı
    const parts = s
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    return parts.length ? parts : null;
  }

  return null;
}

function normDiscountType(x: unknown): DiscountType {
  const s = toStr(x).trim().toLowerCase();
  return s === 'percentage' || s === 'percent' ? 'percentage' : 'fixed';
}

function normApplicableTo(x: unknown): 'all' | 'category' | 'product' {
  const s = toStr(x).trim().toLowerCase();
  return s === 'category' ? 'category' : s === 'product' ? 'product' : 'all';
}

/* -------------------- normalizers -------------------- */

export function normalizeCoupon(row: unknown): Coupon {
  const r = isUnknownRow(row) ? row : {};

  // destek: usage_limit || max_uses
  const maxUsesRaw =
    (r as Record<string, unknown>).usage_limit ?? (r as Record<string, unknown>).max_uses;

  return {
    id: toTrimStr((r as Record<string, unknown>).id),
    code: toTrimStr((r as Record<string, unknown>).code),

    title: toOptStr((r as Record<string, unknown>).title) ?? null,
    content_html: toOptStr((r as Record<string, unknown>).content_html) ?? null,

    discount_type: normDiscountType((r as Record<string, unknown>).discount_type),
    discount_value: toNum((r as Record<string, unknown>).discount_value, 0),

    min_purchase:
      (r as Record<string, unknown>).min_purchase == null
        ? 0
        : toNum((r as Record<string, unknown>).min_purchase, 0),

    max_discount:
      (r as Record<string, unknown>).max_discount == null
        ? null
        : toNum((r as Record<string, unknown>).max_discount, 0),

    is_active: toBool01((r as Record<string, unknown>).is_active),
    max_uses: maxUsesRaw == null ? null : toNum(maxUsesRaw, 0),
    used_count:
      (r as Record<string, unknown>).used_count == null
        ? null
        : toNum((r as Record<string, unknown>).used_count, 0),

    valid_from: toIso((r as Record<string, unknown>).valid_from),
    valid_until: toIso(
      (r as Record<string, unknown>).valid_until ?? (r as Record<string, unknown>).valid_to,
    ),

    applicable_to: normApplicableTo((r as Record<string, unknown>).applicable_to),
    category_ids: tryParseJsonArrayStrings((r as Record<string, unknown>).category_ids),
    product_ids: tryParseJsonArrayStrings((r as Record<string, unknown>).product_ids),

    // ✅ undefined yerine null
    created_at:
      typeof (r as Record<string, unknown>).created_at === 'string'
        ? ((r as Record<string, unknown>).created_at as string)
        : null,

    updated_at:
      typeof (r as Record<string, unknown>).updated_at === 'string'
        ? ((r as Record<string, unknown>).updated_at as string)
        : null,
  };
}

export function normalizeCouponList(res: unknown): Coupon[] {
  // tolerans: {data|items|rows|result|coupons} içinden de pluck edebilirsin ama
  // mevcut kullanım array ise bu yeterli.
  if (!Array.isArray(res)) return [];
  return (res as unknown[]).map((x) => normalizeCoupon(x));
}

/* -------------------- query builders -------------------- */

export function toCouponsQuery(params?: CouponListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();

  if (params.q) sp.set('q', params.q);

  if (params.is_active !== undefined) {
    const b = typeof params.is_active === 'boolean' ? params.is_active : toBool01(params.is_active);
    sp.set('is_active', b ? '1' : '0');
  }

  if (typeof params.limit === 'number') sp.set('limit', String(params.limit));
  if (typeof params.offset === 'number') sp.set('offset', String(params.offset));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/* -------------------- body mappers -------------------- */

/** Create/Update body'yi BE'ye güvenli taşı (numbers/bools normalize edilir) */
export function toCouponApiBody(
  body: CreateCouponBody | UpdateCouponBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if ('code' in body && typeof body.code !== 'undefined') out.code = toTrimStr(body.code);
  if (typeof body.title !== 'undefined') out.title = body.title ?? null;
  if (typeof body.content_html !== 'undefined') out.content_html = body.content_html ?? null;

  // Create'de zorunlu alanlar: discount_type / discount_value
  if (typeof (body as CreateCouponBody).discount_type !== 'undefined')
    out.discount_type = (body as CreateCouponBody).discount_type;

  if (typeof (body as CreateCouponBody).discount_value !== 'undefined')
    out.discount_value = toNum((body as CreateCouponBody).discount_value, 0);

  if (typeof body.min_purchase !== 'undefined')
    out.min_purchase = body.min_purchase == null ? null : toNum(body.min_purchase, 0);

  if (typeof body.max_discount !== 'undefined')
    out.max_discount = body.max_discount == null ? null : toNum(body.max_discount, 0);

  if (typeof body.usage_limit !== 'undefined')
    out.usage_limit = body.usage_limit == null ? null : toNum(body.usage_limit, 0);

  if (typeof body.valid_from !== 'undefined') out.valid_from = body.valid_from ?? null;
  if (typeof body.valid_until !== 'undefined') out.valid_until = body.valid_until ?? null;

  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;

  if (typeof body.applicable_to !== 'undefined') out.applicable_to = body.applicable_to ?? 'all';

  if (typeof body.category_ids !== 'undefined') out.category_ids = body.category_ids ?? null;
  if (typeof body.product_ids !== 'undefined') out.product_ids = body.product_ids ?? null;

  return out;
}


// -------------------------------------------------------------
// EXTRA — small exports for UI safety (ES2019+ compatible)
// -------------------------------------------------------------

/** ISO veya date-like string'i "YYYY-MM-DD" formatına indirger; yoksa null */
export function isoToDateOnlySafe(iso: string | null): string | null {
  if (!iso) return null;
  const parts = String(iso).split('T');
  const first = parts[0];
  return typeof first === 'string' && first ? first : null;
}

/** Bugünün YYYY-MM-DD string'i */
export function todayDateOnly(): string {
  const parts = new Date().toISOString().split('T');
  const first = parts[0];
  return typeof first === 'string' && first ? first : '1970-01-01';
}

