// =============================================================
// FILE: src/integrations/types/reviews.ts
// FINAL — Review types + helpers + normalizers + query builders
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu (undefined property set edilmez)
// =============================================================
import { QueryParams} from '@/integrations/types';
/* -------------------- domain types -------------------- */

// Hedef tipi projene göre genişletebilirsin (service/product/category/page vs.)
export type ReviewTargetType = 'service' | 'product' | 'category' | 'page' | 'custom';

/** API raw row (admin/public) — backend farklı alan isimleri döndürebilir */
export type ApiReview = Record<string, unknown>;

/** FE view model (normalized) */
export type ReviewView = {
  id: string;

  // Author / customer
  author_name: string | null;
  author_email: string | null;

  title: string | null;
  message: string | null;

  rating: number; // 1..5
  is_active: boolean;
  is_approved: boolean;

  // Target-aware fields
  target_type: ReviewTargetType | null;
  target_id: string | null;
  target_slug: string | null;

  // timestamps
  created_at: string | null;
  updated_at: string | null;
};

/** List query params (admin/public ortak) */
export type ReviewListParams = {
  search?: string;

  approved?: boolean;
  active?: boolean;

  minRating?: number;
  maxRating?: number;

  // target filters (public tarafında da kullanılabilir)
  target_type?: ReviewTargetType;
  target_id?: string;
  target_slug?: string;

  limit?: number;
  offset?: number;

  orderBy?: 'created_at' | 'updated_at' | 'rating';
  order?: 'asc' | 'desc';
};

/** Create payload (public + admin create) */
export type ReviewCreateInput = {
  author_name?: string | null;
  author_email?: string | null;

  title?: string | null;
  message: string;
  rating: number;

  target_type?: ReviewTargetType | null;
  target_id?: string | null;
  target_slug?: string | null;

  is_active?: boolean;
};

/** Admin update payload */
export type ReviewUpdateInput = {
  author_name?: string | null;
  author_email?: string | null;

  title?: string | null;
  message?: string | null;
  rating?: number | null;

  is_active?: boolean;
  is_approved?: boolean;

  target_type?: ReviewTargetType | null;
  target_id?: string | null;
  target_slug?: string | null;
};

/* -------------------- helpers -------------------- */

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
};

const toTrimStr = (v: unknown): string => toStr(v).trim();

const toOptStr = (v: unknown): string | null => {
  const s = toTrimStr(v);
  return s ? s : null;
};

const toBoolLoose = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = toStr(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'active', 'enabled', 'approved'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'inactive', 'disabled'].includes(s)) return false;
  return fallback;
};

const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const pickFirst = (src: ApiReview, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const val = src[k];
    if (val != null) return val;
  }
  return undefined;
};

const pickString = (src: ApiReview, keys: readonly string[]): string | null => {
  const v = pickFirst(src, keys);
  return toOptStr(v);
};

const pickBool = (src: ApiReview, keys: readonly string[], fallback = false): boolean => {
  const v = pickFirst(src, keys);
  return v == null ? fallback : toBoolLoose(v, fallback);
};

const pickNumber = (src: ApiReview, keys: readonly string[], d = 0): number => {
  const v = pickFirst(src, keys);
  return v == null ? d : toNum(v, d);
};

function normTargetType(x: unknown): ReviewTargetType | null {
  const s = toTrimStr(x).toLowerCase();
  if (!s) return null;
  if (s === 'service' || s === 'product' || s === 'category' || s === 'page') return s;
  return 'custom';
}

/* -------------------- normalizers -------------------- */

export function normalizeReview(row: unknown): ReviewView {
  const r: ApiReview = row && typeof row === 'object' ? (row as ApiReview) : {};

  const ratingRaw = pickNumber(r, ['rating', 'stars', 'score'], 0);
  const rating = clamp(Math.round(ratingRaw || 0), 1, 5);

  return {
    id: toTrimStr(pickFirst(r, ['id', 'review_id'])),

    author_name: pickString(r, ['author_name', 'name', 'customer_name', 'full_name']),
    author_email: pickString(r, ['author_email', 'email', 'customer_email']),

    title: pickString(r, ['title', 'subject']),
    message: pickString(r, ['message', 'content', 'comment', 'body']),

    rating,

    is_active: pickBool(r, ['is_active', 'active', 'enabled', 'status'], true),
    is_approved: pickBool(r, ['is_approved', 'approved', 'isApproved'], false),

    target_type: normTargetType(pickFirst(r, ['target_type', 'targetType', 'entity_type'])),
    target_id: pickString(r, ['target_id', 'targetId', 'entity_id']),
    target_slug: pickString(r, ['target_slug', 'targetSlug', 'entity_slug', 'slug']),

    created_at:
      typeof pickFirst(r, ['created_at', 'createdAt']) === 'string'
        ? (pickFirst(r, ['created_at', 'createdAt']) as string)
        : null,
    updated_at:
      typeof pickFirst(r, ['updated_at', 'updatedAt']) === 'string'
        ? (pickFirst(r, ['updated_at', 'updatedAt']) as string)
        : null,
  };
}

export function normalizeReviewList(res: unknown): ReviewView[] {
  // tolerans: res array ise
  if (Array.isArray(res)) return (res as unknown[]).map(normalizeReview);

  // tolerans: {data|items|rows|result|reviews}
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    for (const k of ['data', 'items', 'rows', 'result', 'reviews'] as const) {
      const v = o[k];
      if (Array.isArray(v)) return (v as unknown[]).map(normalizeReview);
    }
  }
  return [];
}

/* -------------------- query builders -------------------- */

export function toReviewsQuery(p?: ReviewListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.search) q.search = p.search;

  if (typeof p.approved === 'boolean') q.approved = p.approved;
  if (typeof p.active === 'boolean') q.active = p.active;

  if (typeof p.minRating === 'number' && Number.isFinite(p.minRating) && p.minRating >= 1)
    q.minRating = p.minRating;
  if (typeof p.maxRating === 'number' && Number.isFinite(p.maxRating) && p.maxRating >= 1)
    q.maxRating = p.maxRating;

  // TARGET filters
  if (p.target_type) q.target_type = p.target_type;
  if (p.target_id) q.target_id = p.target_id;
  if (p.target_slug) q.target_slug = p.target_slug;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.orderBy) q.orderBy = p.orderBy;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}

/* -------------------- body mappers -------------------- */

export function toReviewCreateApiBody(body: ReviewCreateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    message: String(body.message ?? ''),
    rating: clamp(Math.round(toNum(body.rating, 0)), 1, 5),
  };

  if (typeof body.author_name !== 'undefined') out.author_name = body.author_name ?? null;
  if (typeof body.author_email !== 'undefined') out.author_email = body.author_email ?? null;

  if (typeof body.title !== 'undefined') out.title = body.title ?? null;

  if (typeof body.target_type !== 'undefined') out.target_type = body.target_type ?? null;
  if (typeof body.target_id !== 'undefined') out.target_id = body.target_id ?? null;
  if (typeof body.target_slug !== 'undefined') out.target_slug = body.target_slug ?? null;

  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;

  return out;
}

export function toReviewUpdateApiBody(body: ReviewUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof body.author_name !== 'undefined') out.author_name = body.author_name ?? null;
  if (typeof body.author_email !== 'undefined') out.author_email = body.author_email ?? null;

  if (typeof body.title !== 'undefined') out.title = body.title ?? null;
  if (typeof body.message !== 'undefined') out.message = body.message ?? null;

  if (typeof body.rating !== 'undefined')
    out.rating = body.rating == null ? null : clamp(Math.round(toNum(body.rating, 0)), 1, 5);

  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;
  if (typeof body.is_approved !== 'undefined') out.is_approved = !!body.is_approved;

  if (typeof body.target_type !== 'undefined') out.target_type = body.target_type ?? null;
  if (typeof body.target_id !== 'undefined') out.target_id = body.target_id ?? null;
  if (typeof body.target_slug !== 'undefined') out.target_slug = body.target_slug ?? null;

  return out;
}
