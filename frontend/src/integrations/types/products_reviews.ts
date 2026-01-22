// ===================================================================
// FILE: src/integrations/types/product_reviews.ts
// FINAL — Product Reviews types + normalizers + mappers
// NOTE: common primitives imported from product_faqs.ts (no duplication)
// ===================================================================

import type { BoolLike, QueryParams } from '@/integrations/types';
import { toBool, toNum, extractArray,toStr } from '@/integrations/types';

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);


/* ----------------------------- domain types ----------------------------- */

export type ProductReview = {
  id: string;
  product_id: string;

  customer_name: string | null;
  rating: number;
  comment: string | null;

  /** ISO string veya YYYY-MM-DD; backend ne döndürüyorsa string olarak taşırız */
  review_date: string;

  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

/** Admin create/update input (server sözleşmesi) */
export type ProductReviewInput = {
  id?: string;
  customer_name: string;
  rating: number; // 1..5
  comment: string;
  review_date: string; // YYYY-MM-DD (UI) / ISO (BE tolerant)
  is_active: boolean | 0 | 1;
};

/** Public create body (id yok, product_id zorunlu) */
export type CreateProductReviewBody = Omit<ProductReviewInput, 'id'> & {
  product_id: string;
};

/** Backend raw row (tolerant: snake/camel, boollike, numberlike) */
export type ApiProductReview = Partial<{
  id: unknown;

  product_id: unknown;
  productId: unknown;

  customer_name: unknown;
  customerName: unknown;

  rating: unknown;
  comment: unknown;

  review_date: unknown;
  reviewDate: unknown;

  is_active: BoolLike;
  isActive: BoolLike;

  created_at: unknown;
  createdAt: unknown;
  updated_at: unknown;
  updatedAt: unknown;
}>;

/* ----------------------------- normalizers ----------------------------- */

export function normalizeProductReview(row: unknown): ProductReview {
  const r = (isObject(row) ? row : {}) as unknown as ApiProductReview;

  const id = toStr(r.id);
  const product_id = toStr(r.product_id ?? r.productId);

  const customer_name_raw = r.customer_name ?? r.customerName;
  const customer_name = customer_name_raw == null ? null : toStr(customer_name_raw).trim() || null;

  const rating = Math.max(0, toNum(r.rating ?? 0));
  const comment_raw = r.comment;
  const comment = comment_raw == null ? null : toStr(comment_raw).trim() || null;

  const review_date = toStr(r.review_date ?? r.reviewDate);

  const is_active = toBool((r.is_active ?? r.isActive) as BoolLike);

  const created_at = toStr(r.created_at ?? r.createdAt) || undefined;
  const updated_at = toStr(r.updated_at ?? r.updatedAt) || undefined;

  return {
    id,
    product_id,
    customer_name,
    rating,
    comment,
    review_date,
    is_active,
    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeProductReviews(res: unknown): ProductReview[] {
  return extractArray(res).map((x) => normalizeProductReview(x));
}

/* ----------------------------- query/body mappers ----------------------------- */

export type AdminListProductReviewsParams = {
  id: string; // product id (path)
  only_active?: BoolLike;
  order?: 'asc' | 'desc';
};

export function toAdminListProductReviewsQuery(
  p: AdminListProductReviewsParams,
): QueryParams | undefined {
  const out: QueryParams = {};
  if (typeof p.only_active !== 'undefined') out.only_active = toBool(p.only_active) ? 1 : 0;
  if (p.order) out.order = p.order;
  return Object.keys(out).length ? out : undefined;
}

export type PublicListProductReviewsParams = {
  product_id?: string;
  only_active?: BoolLike;
};

export function toPublicListProductReviewsQuery(
  p?: PublicListProductReviewsParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};
  if (p.product_id) out.product_id = p.product_id;
  if (typeof p.only_active !== 'undefined') out.only_active = toBool(p.only_active) ? 1 : 0;

  return Object.keys(out).length ? out : undefined;
}

export function toReviewInputBody(b: Partial<ProductReviewInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // nullable alanları server contractına uygun gönder
  if (typeof b.customer_name === 'string') out.customer_name = b.customer_name;
  if (typeof b.comment === 'string') out.comment = b.comment;

  if (typeof b.rating === 'number') out.rating = b.rating;
  if (typeof b.review_date === 'string') out.review_date = b.review_date;

  if (typeof b.is_active !== 'undefined') out.is_active = toBool(b.is_active) ? 1 : 0;

  // replace için opsiyonel
  if (typeof b.id === 'string' && b.id.trim()) out.id = b.id;

  return out;
}

export function toCreateReviewBody(b: CreateProductReviewBody): Record<string, unknown> {
  return {
    product_id: b.product_id,
    ...toReviewInputBody(b),
  };
}

export function toReplaceReviewsBody(
  reviews: Array<ProductReviewInput | ProductReview>,
): Record<string, unknown> {
  return {
    reviews: reviews.map((r) => {
      const asInput: ProductReviewInput = {
        ...(typeof (r as ProductReviewInput).id === 'string'
          ? { id: (r as ProductReviewInput).id }
          : {}),
        customer_name:
          (r as ProductReview).customer_name ?? (r as ProductReviewInput).customer_name ?? '',
        rating: Number((r as ProductReview).rating ?? (r as ProductReviewInput).rating ?? 0),
        comment: (r as ProductReview).comment ?? (r as ProductReviewInput).comment ?? '',
        review_date:
          (r as ProductReview).review_date ?? (r as ProductReviewInput).review_date ?? '',
        is_active: Boolean(
          (r as ProductReview).is_active ?? (r as ProductReviewInput).is_active ?? true,
        ),
      };
      return toReviewInputBody(asInput);
    }),
  };
}
