// =============================================================
// FILE: src/integrations/types/cart.ts
// FINAL — Cart types + helpers + normalizers (central types barrel)
// - Admin Carts (aggregate carts)
// - Public Cart Items (/cart_items + products join)
// =============================================================

import { isUnknownRow ,toStr} from '@/integrations/types';

/* -------------------- helpers -------------------- */

function toOptStr(v: unknown): string | null {
  if (v == null) return null;
  const s = toStr(v).trim();
  return s ? s : null;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

function toFiniteNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function tryJson<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  try {
    const d = v instanceof Date ? v : new Date(v as string | number);
    const iso = new Date(d).toISOString();
    return iso;
  } catch {
    return null;
  }
}

/* -------------------- ADMIN CARTS -------------------- */

/** Admin paneldeki sepet item (normalize edilmiş) */
export type AdminCartItem = {
  id: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  sku: string | null;
  qty: number;
  price: number; // unit
  subtotal: number; // qty * price
  image_url: string | null;
  meta: Record<string, unknown> | null;
};

/** BE ham item (string/number karışık + meta JSON-string olabilir) */
export type AdminApiCartItem = Record<string, unknown>;

/** Admin panel sepet (normalize edilmiş) */
export type AdminCart = {
  id: string;
  user_id: string | null;
  user: { id: string; email: string | null; name: string | null } | null;

  currency: string;

  items: AdminCartItem[];

  subtotal: number;
  discount_total: number;
  total_price: number;

  coupon_code: string | null;
  note: string | null;

  is_locked: boolean;

  created_at: string;
  updated_at: string | null;
};

/** BE ham cart (items JSON-string olabilir) */
export type AdminApiCart = Record<string, unknown>;

/* ---- Admin query/body types (RTK uses) ---- */

export type AdminCartsListParams = {
  q?: string;
  user_id?: string;
  has_coupon?: boolean;
  is_guest?: boolean;
  min_total?: number;
  max_total?: number;

  starts_at?: string;
  ends_at?: string;

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'updated_at' | 'total_price' | 'subtotal';
  order?: 'asc' | 'desc';

  include?: Array<'user'>;
};

export type AdminCartAddItemBody = {
  product_id: string;
  variant_id?: string | null;
  qty: number;
  price?: number | null;
  meta?: Record<string, unknown> | null;
};

export type AdminCartUpdateItemBody = {
  qty?: number;
  price?: number | null;
  meta?: Record<string, unknown> | null;
};

export type AdminCartUpdateCartBody = {
  note?: string | null;
  currency?: string | null;
  lock?: boolean;
};

export type AdminCartMergeBody = { target_id: string; source_id: string };
export type AdminCartApplyCouponBody = { code: string };

/* -------------------- ADMIN normalizers -------------------- */

function normalizeAdminCartItem(row: unknown): AdminCartItem {
  const r = isUnknownRow(row) ? row : {};

  const metaRaw = r.meta;
  const metaParsed =
    metaRaw == null
      ? null
      : typeof metaRaw === 'string'
      ? tryJson<Record<string, unknown>>(metaRaw) ?? null
      : isUnknownRow(metaRaw)
      ? metaRaw
      : null;

  return {
    id: toStr(r.id),
    product_id: toStr(r.product_id),
    variant_id: toOptStr(r.variant_id),
    name: toStr(r.name),
    sku: toOptStr(r.sku),
    qty: toFiniteNumber(r.qty),
    price: toFiniteNumber(r.price),
    subtotal: toFiniteNumber(r.subtotal),
    image_url: toOptStr(r.image_url),
    meta: metaParsed,
  };
}

export function normalizeAdminCart(row: unknown): AdminCart {
  const r = isUnknownRow(row) ? row : {};

  const userRaw = r.user;
  const user = isUnknownRow(userRaw)
    ? {
        id: toStr(userRaw.id),
        email: toOptStr(userRaw.email),
        name: toOptStr(userRaw.name),
      }
    : null;

  const itemsRaw = r.items;
  let itemsArr: unknown[] = [];
  if (Array.isArray(itemsRaw)) {
    itemsArr = itemsRaw;
  } else {
    const parsed = tryJson<unknown[]>(itemsRaw);
    itemsArr = Array.isArray(parsed) ? parsed : [];
  }

  return {
    id: toStr(r.id),
    user_id: toOptStr(r.user_id),
    user,

    currency: toStr(r.currency || 'TRY'),

    items: itemsArr.map(normalizeAdminCartItem),

    subtotal: toFiniteNumber(r.subtotal),
    discount_total: toFiniteNumber(r.discount_total),
    total_price: toFiniteNumber(r.total_price),

    coupon_code: toOptStr(r.coupon_code),
    note: toOptStr(r.note),

    is_locked: toBool(r.is_locked),

    created_at: toStr(r.created_at),
    updated_at: toIsoOrNull(r.updated_at),
  };
}

export function normalizeAdminCartList(res: unknown): AdminCart[] {
  return Array.isArray(res) ? res.map(normalizeAdminCart) : [];
}

/* -------------------- PUBLIC CART ITEMS -------------------- */

export type PublicCartItemProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;

  delivery_type: string | null;
  stock_quantity: number | null;

  custom_fields: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options: { quantity: number; price: number }[] | null;

  api_provider_id: string | null;
  api_product_id: string | null;
  api_quantity: number | null;

  category_id: string | null;
  categories: { id: string; name: string } | null;
};

export type PublicApiCartItemProduct = Record<string, unknown>;

export type PublicCartItem = {
  id: string;
  user_id: string | null;
  product_id: string;
  quantity: number;
  selected_options: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  products: PublicCartItemProduct | null;
};

export type PublicApiCartItem = Record<string, unknown>;

/* ---- Public endpoint query/body types ---- */

export type PublicCartItemsListParams = {
  user_id?: string;
  with?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
};

export type PublicCartItemCreateBody = {
  user_id: string;
  product_id: string;
  quantity: number;
  selected_options?: Record<string, unknown> | null;
};

export type PublicCartItemPatchBody = {
  id: string;
  quantity?: number;
  selected_options?: Record<string, unknown> | null;
};

/* -------------------- PUBLIC normalizers -------------------- */

function normalizePublicProduct(p: unknown): PublicCartItemProduct | null {
  if (!isUnknownRow(p)) return null;

  const customFieldsRaw = p.custom_fields;
  const customFields =
    typeof customFieldsRaw === 'string'
      ? tryJson<ReadonlyArray<Record<string, unknown>>>(customFieldsRaw)
      : Array.isArray(customFieldsRaw)
      ? (customFieldsRaw as ReadonlyArray<Record<string, unknown>>)
      : null;

  const quantityOptionsRaw = p.quantity_options;
  const quantityOptions =
    typeof quantityOptionsRaw === 'string'
      ? tryJson<PublicCartItemProduct['quantity_options']>(quantityOptionsRaw)
      : (quantityOptionsRaw as PublicCartItemProduct['quantity_options'] | null);

  const categoriesRaw = p.categories;
  const categories = isUnknownRow(categoriesRaw)
    ? { id: toStr(categoriesRaw.id), name: toStr(categoriesRaw.name) }
    : null;

  return {
    id: toStr(p.id),
    name: toStr(p.name),
    slug: toStr(p.slug),
    price: toFiniteNumber(p.price),
    image_url: toOptStr(p.image_url),

    delivery_type: toOptStr(p.delivery_type),
    stock_quantity: p.stock_quantity == null ? null : toFiniteNumber(p.stock_quantity),

    custom_fields: customFields ?? null,
    quantity_options: quantityOptions ?? null,

    api_provider_id: toOptStr(p.api_provider_id),
    api_product_id: toOptStr(p.api_product_id),
    api_quantity: p.api_quantity == null ? null : toFiniteNumber(p.api_quantity),

    category_id: toOptStr(p.category_id),
    categories,
  };
}

export function normalizePublicCartItem(row: unknown): PublicCartItem {
  const r = isUnknownRow(row) ? row : {};

  const selectedRaw = r.selected_options;
  const selected =
    selectedRaw == null
      ? null
      : typeof selectedRaw === 'string'
      ? tryJson<Record<string, unknown>>(selectedRaw) ?? null
      : isUnknownRow(selectedRaw)
      ? selectedRaw
      : null;

  return {
    id: toStr(r.id),
    user_id: toOptStr(r.user_id),
    product_id: toStr(r.product_id),
    quantity: toFiniteNumber(r.quantity),
    selected_options: selected,
    created_at: typeof r.created_at === 'string' ? r.created_at : null,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
    products: normalizePublicProduct(r.products),
  };
}

export function normalizePublicCartItemList(res: unknown): PublicCartItem[] {
  return Array.isArray(res) ? res.map(normalizePublicCartItem) : [];
}

/* -------------------- query builders -------------------- */

export function toAdminCartsQuery(p?: AdminCartsListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (p.q) sp.set('q', p.q);
  if (p.user_id) sp.set('user_id', p.user_id);

  if (typeof p.has_coupon === 'boolean') sp.set('has_coupon', p.has_coupon ? '1' : '0');
  if (typeof p.is_guest === 'boolean') sp.set('is_guest', p.is_guest ? '1' : '0');

  if (typeof p.min_total === 'number') sp.set('min_total', String(p.min_total));
  if (typeof p.max_total === 'number') sp.set('max_total', String(p.max_total));

  if (p.starts_at) sp.set('starts_at', p.starts_at);
  if (p.ends_at) sp.set('ends_at', p.ends_at);

  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));

  if (p.sort) sp.set('sort', p.sort);
  if (p.order) sp.set('order', p.order);

  if (p.include && p.include.length) sp.set('include', p.include.join(','));

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function toPublicCartItemsQuery(p?: PublicCartItemsListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (p.user_id) sp.set('user_id', p.user_id);
  if (p.with) sp.set('with', p.with);

  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));

  if (p.sort) sp.set('sort', p.sort);
  if (p.order) sp.set('order', p.order);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
