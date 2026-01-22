// =============================================================
// FILE: src/integrations/types/footer.ts
// FINAL — Footer types + normalizers + query/body helpers (single source)
// exactOptionalPropertyTypes: true uyumlu
// no-explicit-any uyumlu (typed query params)
// =============================================================

import type {
  SortOrder,
  QueryParams,
 } from '@/integrations/types';



/* -------------------- types -------------------- */

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionSortBy = 'display_order' | 'created_at' | 'title';

/** Admin list params (FE) */
export type FooterSectionAdminListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: FooterSectionSortBy;
  order?: SortOrder;
};

/** Public list params (FE) */
export type FooterSectionPublicListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  // public backend: çoğunlukla display_order varsayılan, sadece order yönü
  order?: SortOrder;
};

/** Reorder payload item */
export type ReorderFooterSectionItem = {
  id: string;
  display_order: number;
};

/** Admin upsert body (FE) */
export type UpsertFooterSectionBody = {
  title: string;
  links?: FooterLink[];
  is_active?: boolean;
  display_order?: number;
};

/** API raw model (admin/public) */
export type ApiFooterSection = {
  id: string;

  title?: string | null;
  links?: string | FooterLink[] | null;

  is_active?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null;

  display_order?: number | string | null;
  position?: number | string | null; // legacy compat

  created_at?: string | null;
  updated_at?: string | null;
};

/** FE normalized model */
export type FooterSection = {
  id: string;
  title: string;
  links: FooterLink[];
  is_active: boolean;
  display_order: number;

  // ✅ exactOptionalPropertyTypes friendly:
  created_at: string | null;
  updated_at: string | null;
};

/* ----------------------------- helpers ----------------------------- */

const toNum = (x: unknown): number => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  const n = Number(x ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toBool = (x: unknown, fallback = true): boolean => {
  if (x === null || typeof x === 'undefined') return fallback;
  if (typeof x === 'boolean') return x;
  if (typeof x === 'number') return x !== 0;
  const s = String(x).trim().toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return fallback;
};

export function safeParseFooterLinks(src: unknown): FooterLink[] {
  if (Array.isArray(src)) return src as FooterLink[];
  if (typeof src !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(src);
    return Array.isArray(parsed) ? (parsed as FooterLink[]) : [];
  } catch {
    return [];
  }
}

/** API → FE */
export function normalizeFooterSection(row: ApiFooterSection): FooterSection {
  const created_at =
    typeof row.created_at === 'string' && row.created_at.trim() ? row.created_at : null;
  const updated_at =
    typeof row.updated_at === 'string' && row.updated_at.trim() ? row.updated_at : null;

  const links = safeParseFooterLinks(row.links);

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    links,
    is_active: toBool(row.is_active, true),
    display_order: toNum(row.display_order ?? row.position ?? 0),

    created_at,
    updated_at,
  };
}

/** FE → Admin API body */
export function toFooterSectionAdminBody(b: UpsertFooterSectionBody): Record<string, unknown> {
  const display_order = typeof b.display_order === 'number' ? b.display_order : 0;
  const is_active = typeof b.is_active === 'boolean' ? b.is_active : true;

  // Backend bazı projelerde links string bekleyebilir; en güvenlisi JSON string göndermek.
  const links =
    typeof b.links === 'undefined'
      ? undefined
      : JSON.stringify(Array.isArray(b.links) ? b.links : []);

  return {
    title: String(b.title ?? ''),
    is_active,
    display_order,
    position: display_order, // legacy compat
    ...(typeof links !== 'undefined' ? { links } : {}),
  };
}

/** Admin list query → BE query */
export function toFooterSectionAdminQuery(
  p?: FooterSectionAdminListParams,
): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.q) q.q = p.q;
  if (typeof p.is_active === 'boolean') q.is_active = p.is_active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}

/** Public list query → BE query */
export function toFooterSectionPublicQuery(
  p?: FooterSectionPublicListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.q) q.q = p.q;
  if (typeof p.is_active === 'boolean') q.is_active = p.is_active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}
