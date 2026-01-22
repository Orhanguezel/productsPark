// ===================================================================
// FILE: src/integrations/types/product_faqs.ts
// FINAL — Product FAQs types + helpers + normalizers + mappers
// - no-explicit-any
// - strict / exactOptionalPropertyTypes friendly
// - central helpers: toStr/toBool/toNum
// ===================================================================

/* ----------------------------- primitives ----------------------------- */

import type { BoolLike, QueryParams } from '@/integrations/types';
import { toBool, toStr, toNum, extractArray } from '@/integrations/types';

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);



/* ----------------------------- domain types ----------------------------- */

export type ProductFaq = {
  id: string;
  product_id: string;

  question: string;
  answer: string;

  display_order: number;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

/** Admin create/update input */
export type ProductFaqInput = {
  id?: string; // update/replace için opsiyonel
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean | 0 | 1;
};

/** Backend raw row (tolerant: snake/camel, boollike, numberlike) */
export type ApiProductFaq = Partial<{
  id: unknown;
  product_id: unknown;
  productId: unknown;

  question: unknown;
  answer: unknown;

  display_order: unknown;
  displayOrder: unknown;

  is_active: unknown;
  isActive: unknown;

  created_at: unknown;
  createdAt: unknown;
  updated_at: unknown;
  updatedAt: unknown;
}>;

/* ----------------------------- helpers ----------------------------- */

const trimStr = (v: unknown): string => toStr(v).trim();

const nullify = (v: unknown): string | null => {
  const s = trimStr(v);
  return s ? s : null;
};

/** unknown -> BoolLike daraltma (common BoolLike union’una uyumlu) */
const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v;
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
  }

  return undefined;
};

const hasOwn = (obj: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

/** ProductFaq mi? (view type guard) */
const isProductFaq = (x: unknown): x is ProductFaq => {
  if (!isObject(x)) return false;

  // view'da product_id ve display_order net olmalı
  const id = x.id;
  const product_id = (x as Record<string, unknown>).product_id;
  const question = (x as Record<string, unknown>).question;
  const answer = (x as Record<string, unknown>).answer;

  return (
    typeof id === 'string' &&
    typeof product_id === 'string' &&
    typeof question === 'string' &&
    typeof answer === 'string'
  );
};

/** ProductFaqInput mi? (input type guard) */
const isProductFaqInput = (x: unknown): x is ProductFaqInput => {
  if (!isObject(x)) return false;
  const question = (x as Record<string, unknown>).question;
  const answer = (x as Record<string, unknown>).answer;
  const display_order = (x as Record<string, unknown>).display_order;
  const is_active = (x as Record<string, unknown>).is_active;

  return (
    typeof question === 'string' &&
    typeof answer === 'string' &&
    typeof display_order === 'number' &&
    (typeof is_active === 'boolean' || is_active === 0 || is_active === 1)
  );
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeProductFaq(row: unknown): ProductFaq {
  const r = (isObject(row) ? row : {}) as ApiProductFaq;

  const id = trimStr(r.id);
  const product_id = trimStr(r.product_id ?? r.productId);

  const question = trimStr(r.question);
  const answer = trimStr(r.answer);

  const display_order = toNum(r.display_order ?? r.displayOrder ?? 0);
  const is_active = toBool(asBoolLike(r.is_active ?? r.isActive), false);

  const created_at = nullify(r.created_at ?? r.createdAt) ?? undefined;
  const updated_at = nullify(r.updated_at ?? r.updatedAt) ?? undefined;

  return {
    id,
    product_id,
    question,
    answer,
    display_order,
    is_active,
    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeProductFaqs(res: unknown): ProductFaq[] {
  return extractArray(res).map((x) => normalizeProductFaq(x));
}

/* ----------------------------- query mappers ----------------------------- */

export type AdminListProductFaqsParams = {
  id: string; // product id (path)
  only_active?: BoolLike;
};

export function toAdminListProductFaqsQuery(
  p: AdminListProductFaqsParams,
): QueryParams | undefined {
  const out: QueryParams = {};
  if (typeof p.only_active !== 'undefined') out.only_active = toBool(p.only_active) ? 1 : 0;
  return Object.keys(out).length ? out : undefined;
}

export type PublicListProductFaqsParams = {
  product_id?: string;
  only_active?: BoolLike;
};

export function toPublicListProductFaqsQuery(
  p?: PublicListProductFaqsParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};
  if (p.product_id) out.product_id = p.product_id;
  if (typeof p.only_active !== 'undefined') out.only_active = toBool(p.only_active) ? 1 : 0;

  return Object.keys(out).length ? out : undefined;
}

/* ----------------------------- body mappers ----------------------------- */

/**
 * Create/Update (PATCH) body mapper:
 * - sadece gönderilen alanları set eder
 * - exactOptionalPropertyTypes friendly (undefined set edilmez)
 */
export function toFaqInputBody(
  b: ProductFaqInput | Partial<ProductFaqInput>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof b.question === 'string') out.question = b.question;
  if (typeof b.answer === 'string') out.answer = b.answer;

  if (typeof b.display_order === 'number') out.display_order = b.display_order;

  if (typeof b.is_active !== 'undefined') {
    // boolean | 0 | 1
    const v: BoolLike = typeof b.is_active === 'boolean' ? b.is_active : b.is_active === 1 ? 1 : 0;
    out.is_active = toBool(v) ? 1 : 0;
  }

  if (typeof b.id === 'string' && b.id.trim()) out.id = b.id.trim();

  return out;
}

/**
 * Replace body için normalize:
 * - ProductFaq (view) veya ProductFaqInput kabul eder
 * - her item için ProductFaqInput üretir (question/answer/display_order/is_active garanti)
 * - id varsa ekler
 */
function normalizeToFaqInput(item: ProductFaq | ProductFaqInput): ProductFaqInput {
  if (isProductFaq(item)) {
    return {
      ...(item.id && item.id.trim() ? { id: item.id.trim() } : {}),
      question: item.question,
      answer: item.answer,
      display_order: Number.isFinite(item.display_order) ? item.display_order : 0,
      is_active: item.is_active ? 1 : 0,
    };
  }

  // ProductFaqInput ise zaten format doğru; yine de id trim + boole normalize edelim
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const isActive =
    typeof item.is_active === 'boolean' ? (item.is_active ? 1 : 0) : item.is_active === 1 ? 1 : 0;

  return {
    ...(id ? { id } : {}),
    question: item.question,
    answer: item.answer,
    display_order: Number.isFinite(item.display_order) ? item.display_order : 0,
    is_active: isActive,
  };
}

export function toReplaceFaqsBody(
  faqs: Array<ProductFaqInput | ProductFaq>,
): Record<string, unknown> {
  return {
    faqs: faqs.map((f) => toFaqInputBody(normalizeToFaqInput(f))),
  };
}
