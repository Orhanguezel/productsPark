// =============================================================
// FILE: src/integrations/types/dashboard_admin.ts
// FINAL — Dashboard Admin types + helpers (counts + latest lists)
// =============================================================

import type { FetchArgs, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

type UnknownRec = Readonly<Record<string, unknown>>;

export function isObj(v: unknown): v is UnknownRec {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/* -------------------- counts -------------------- */

export function getTotalFromMeta(meta?: FetchBaseQueryMeta, fallback = 0): number {
  const h = meta?.response?.headers;
  if (!h) return fallback;
  const v = h.get('x-total-count') || h.get('X-Total-Count');
  const n = v ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** JSON gövdesi { total } / { count } / { meta:{total} } / { pagination:{total} } ... destekler */
export function coerceCount(data: unknown, meta?: FetchBaseQueryMeta): number {
  const totalFromHeader = getTotalFromMeta(meta, 0);
  if (totalFromHeader) return totalFromHeader;

  if (isObj(data)) {
    const total = data.total;
    if (typeof total === 'number') return total;

    const count = data.count;
    if (typeof count === 'number') return count;

    const metaObj = data.meta;
    if (isObj(metaObj) && typeof metaObj.total === 'number') return metaObj.total;

    const pag = data.pagination;
    if (isObj(pag) && typeof pag.total === 'number') return pag.total;

    // bazı BE'ler items_total döndürebiliyor
    if (Array.isArray(data.items) && typeof data.items_total === 'number') return data.items_total;
  }

  if (Array.isArray(data)) return data.length;
  return 0;
}

/* -------------------- items list -------------------- */

/** Body: { items: T[] } / { data: T[] } / { results: T[] } / T[] -> T[] */
export function coerceItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (isObj(data)) {
    if (Array.isArray(data.items)) return data.items as T[];
    if (Array.isArray(data.data)) return data.data as T[];
    if (Array.isArray(data.results)) return data.results as T[];
  }
  return [];
}

/* -------------------- query builders -------------------- */

export function toCountQuery(url: string, params?: Record<string, unknown>): FetchArgs {
  return {
    url,
    params: { limit: 1, offset: 0, ...(params ?? {}) },
    // admin uçları yetki ister; x-skip-auth KULLANMA
  };
}

export function toListQuery(url: string, params?: Record<string, unknown>): FetchArgs {
  return {
    url,
    params: {
      limit: 10,
      offset: 0,
      orderBy: 'created_at',
      order: 'desc',
      ...(params ?? {}),
    },
  };
}

/* -------------------- lite models -------------------- */

export type ProductLite = {
  id: string | number;
  title?: string;
  price?: number | string | null;
  created_at?: string | Date | null;
  sub_category_id?: string | number | null;
};

export type UserLite = {
  id: string | number;
  email?: string;
  full_name?: string | null;
  roles?: string[] | string | null;
  created_at?: string | Date | null;
};
