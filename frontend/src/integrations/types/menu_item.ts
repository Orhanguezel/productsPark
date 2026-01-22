// =============================================================
// FILE: src/integrations/types/menu_item.ts
// FINAL — Menu types + normalizers + query/body helpers (single source)
// =============================================================

import type { BoolLike, SortOrder } from '@/integrations/types';

export type MenuLocation = 'header' | 'footer';
export type MenuItemType = 'page' | 'custom';

export type MenuOrderKey =
  | 'display_order'
  | 'display_order.desc'
  | 'position'
  | 'position.desc'
  | 'order_num'
  | 'order_num.desc'
  | 'created_at'
  | 'created_at.desc'
  | 'updated_at'
  | 'updated_at.desc';

/** Public list query params (FE) */
export type MenuPublicListParams = {
  order?: MenuOrderKey;
  is_active?: BoolLike;
  parent_id?: string | null;
  limit?: number;
  offset?: number;

  // optional/legacy
  locale?: string;
  select?: string;
  location?: MenuLocation | string;
  section_id?: string | null;
};

/** Admin list query params (FE) */
export type MenuAdminListParams = {
  q?: string;
  location?: MenuLocation;
  section_id?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'created_at' | 'title';
  order?: SortOrder;
};

/** FE model (public + admin ortak) */
export type MenuItem = {
  id: string;
  title: string;
  url: string;

  parent_id: string | null;

  icon: string | null;
  section_id: string | null;

  is_active: boolean;

  display_order: number;

  location: MenuLocation | null;
  type: MenuItemType;
  page_id: string | null;

  created_at?: string;
  updated_at?: string;
};

/** Admin upsert body (FE) */
export type UpsertMenuItemBody = {
  title: string;
  url: string;
  type: MenuItemType;
  page_id?: string | null;
  parent_id?: string | null;
  location: MenuLocation;
  icon?: string | null;
  section_id?: string | null;
  is_active?: boolean;
  display_order?: number;
};

/* ----------------------------- API raw types ----------------------------- */

export type ApiMenuItemPublic = {
  id: string;
  title: string;
  url: string;

  section_id: string | null;
  icon: string | null;

  href?: string | null;
  slug?: string | null;

  parent_id: string | null;

  position?: number | string | null;
  order_num?: number | string | null;
  display_order?: number | string | null;

  location?: MenuLocation | null;

  is_active: BoolLike;

  locale?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ApiMenuItemAdmin = {
  id: string;

  title: string;
  url: string | null;

  type: MenuItemType;
  page_id: string | null;

  parent_id: string | null;

  location: MenuLocation;

  icon: string | null;
  section_id: string | null;

  is_active: BoolLike;

  display_order: number | string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

/* ----------------------------- tiny helpers (safe, no-any) ----------------------------- */

const toNumSafe = (x: unknown): number => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  const n = Number(x ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toBoolSafe = (x: unknown, fallback = true): boolean => {
  if (x === null || typeof x === 'undefined') return fallback;
  if (typeof x === 'boolean') return x;
  if (typeof x === 'number') return x !== 0;
  const s = String(x).trim().toLowerCase();
  if (s === '0' || s === 'false') return false;
  if (s === '1' || s === 'true') return true;
  return fallback;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeMenuItemPublic(row: ApiMenuItemPublic): MenuItem {
  const createdAt =
    typeof row.created_at === 'string' && row.created_at.trim() ? row.created_at : undefined;
  const updatedAt =
    typeof row.updated_at === 'string' && row.updated_at.trim() ? row.updated_at : undefined;

  const displayOrder = toNumSafe(row.display_order ?? row.position ?? row.order_num ?? 0);

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    url: String(row.url ?? ''),

    parent_id: row.parent_id ?? null,

    icon: row.icon ?? null,
    section_id: row.section_id ?? null,

    is_active: toBoolSafe(row.is_active, true),

    display_order: displayOrder,

    location: (row.location ?? null) as MenuLocation | null,
    type: 'custom',
    page_id: null,

    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

export function normalizeMenuItemAdmin(row: ApiMenuItemAdmin): MenuItem {
  const createdAt =
    typeof row.created_at === 'string' && row.created_at.trim() ? row.created_at : undefined;
  const updatedAt =
    typeof row.updated_at === 'string' && row.updated_at.trim() ? row.updated_at : undefined;

  const displayOrder = toNumSafe(row.display_order ?? 0);

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    url: String(row.url ?? ''),

    parent_id: row.parent_id ?? null,

    icon: row.icon ?? null,
    section_id: row.section_id ?? null,

    is_active: toBoolSafe(row.is_active, true),

    display_order: displayOrder,

    location: row.location ?? null,
    type: (row.type ?? 'custom') as MenuItemType,
    page_id: row.page_id ?? null,

    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

/* ----------------------------- FE -> BE body ----------------------------- */

export function toMenuItemAdminBody(b: UpsertMenuItemBody): Record<string, unknown> {
  const display_order = typeof b.display_order === 'number' ? b.display_order : 0;
  const is_active = typeof b.is_active === 'boolean' ? b.is_active : true;

  return {
    title: String(b.title ?? ''),
    url: String(b.url ?? ''),
    href: String(b.url ?? ''), // legacy compat
    type: b.type,
    page_id: b.type === 'page' ? b.page_id ?? null : null,

    parent_id: b.parent_id ?? null,
    location: b.location,

    icon: typeof b.icon === 'undefined' ? null : b.icon ?? null,
    section_id: b.location === 'footer' ? b.section_id ?? null : null,

    is_active,

    display_order,
    position: display_order, // legacy compat
  };
}

/* ----------------------------- query mappers ----------------------------- */

export function toMenuPublicQuery(
  p?: MenuPublicListParams | void,
): Record<string, string> | undefined {
  if (!p) return undefined;

  const params: Record<string, string> = {};

  if (p.order) params.order = p.order;
  if (typeof p.is_active !== 'undefined') params.is_active = String(p.is_active);

  if (p.parent_id !== undefined && p.parent_id !== null) params.parent_id = String(p.parent_id);

  if (typeof p.limit === 'number') params.limit = String(p.limit);
  if (typeof p.offset === 'number') params.offset = String(p.offset);

  if (p.locale) params.locale = p.locale;
  if (p.select) params.select = p.select;
  if (p.location) params.location = String(p.location);
  if (p.section_id != null) params.section_id = String(p.section_id);

  return Object.keys(params).length ? params : undefined;
}

export function toMenuAdminQuery(
  p?: MenuAdminListParams | void,
): Record<string, string> | undefined {
  if (!p) return undefined;

  const params: Record<string, string> = {};

  if (p.q) params.q = p.q;
  if (p.location) params.location = p.location;
  if (p.section_id != null) params.section_id = String(p.section_id);
  if (p.parent_id != null) params.parent_id = String(p.parent_id);
  if (typeof p.is_active === 'boolean') params.is_active = String(p.is_active);

  if (typeof p.limit === 'number') params.limit = String(p.limit);
  if (typeof p.offset === 'number') params.offset = String(p.offset);

  if (p.sort) params.sort = p.sort;
  if (p.order) params.order = p.order;

  return Object.keys(params).length ? params : undefined;
}
