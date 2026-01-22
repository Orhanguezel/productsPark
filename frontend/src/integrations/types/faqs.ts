// =============================================================
// FILE: src/integrations/types/faqs.ts
// FINAL — FAQ types + query helpers (single source of truth)
// exactOptionalPropertyTypes: true uyumlu (created_at/updated_at: string | null)
// no-explicit-any uyumlu (typed query params)
// =============================================================

import type {
  SortOrder,
  QueryParams,
 } from '@/integrations/types';

export type FaqOrderBy = 'created_at' | 'updated_at' | 'display_order';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  slug: string;

  category: string | null;

  is_active: boolean;
  display_order: number;

  created_at: string | null;
  updated_at: string | null;
}

export type FaqListParams = {
  search?: string;
  category?: string;
  active?: boolean;

  limit?: number;
  offset?: number;

  orderBy?: FaqOrderBy;
  order?: SortOrder;
};

export type UpsertFaqInput = {
  question: string;
  answer: string;
  slug?: string;

  category?: string | null;
  is_active?: boolean;
  display_order?: number;
};

export type PatchFaqInput = Partial<UpsertFaqInput>;


/**
 * Backend query contract:
 * - q
 * - is_active
 * - category
 * - limit/offset
 * - order: "display_order.asc" | "created_at.desc" ...
 */
function buildOrder(p?: Pick<FaqListParams, 'orderBy' | 'order'>): string | undefined {
  if (!p?.orderBy || !p?.order) return undefined;
  return `${p.orderBy}.${p.order}`;
}

export function toFaqsAdminQuery(p?: FaqListParams): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.search) q.q = p.search;
  if (typeof p.active === 'boolean') q.is_active = p.active;
  if (p.category) q.category = p.category;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  const order = buildOrder(p);
  if (order) q.order = order;

  return Object.keys(q).length ? q : undefined;
}

/**
 * Public default: is_active=true
 * User passes active=false explicitly => override
 */
export function toFaqsPublicQuery(p?: FaqListParams | void | null): QueryParams {
  const q: QueryParams = {};

  // default public: active
  q.is_active = true;

  if (!p) return q;

  if (p.search) q.q = p.search;
  if (typeof p.active === 'boolean') q.is_active = p.active;
  if (p.category) q.category = p.category;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  const order = buildOrder(p);
  if (order) q.order = order;

  return q;
}
