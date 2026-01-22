// ===================================================================
// FILE: src/integrations/types/products.ts
// FINAL — Products types + helpers + normalizers + mappers
// - central common.ts helpers (toStr/toBool/isObject/BoolLike/QueryParams)
// - strict / no-any friendly
// - exactOptionalPropertyTypes friendly (optional props only set when present)
// ===================================================================

/* ----------------------------- primitives ----------------------------- */

import type { BoolLike, QueryParams } from '@/integrations/types';
import {
  isObject,
  toBool,
  toNum,
  extractArray,
  clamp,
  trimStr,
  toStrArrayOrNull,
  nullify,
  toNumOrNull,
  asBoolLike,
  extractTotal,
} from '@/integrations/types';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

/* ----------------------------- domain types ----------------------------- */

export type CategoryBrief = { id: string; name: string; slug: string };

/** Admin categories minimal */
export type CategoryRow = {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  is_featured?: BoolLike;
};

/* ----------------------------- DB/FE models ----------------------------- */

/** Admin/ProductRow (FE uses as-is; booleans as BoolLike (0/1)) */
export type ProductAdmin = {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  short_description: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;
  cost?: number | null;

  image_url: string | null;
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;

  gallery_urls?: string[] | null;
  gallery_asset_ids?: string[] | null;
  features?: string[] | null;

  rating: number;
  review_count: number;
  sales_count: number;

  product_type?: ProductType;
  delivery_type?: ProductDeliveryType | null;

  custom_fields?: Array<CustomField> | Array<Record<string, unknown>> | null;
  quantity_options?: QuantityOption[] | Array<Record<string, unknown>> | null;

  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;

  meta_title?: string | null;
  meta_description?: string | null;

  article_content?: string | null;
  article_enabled?: BoolLike;
  demo_url?: string | null;
  demo_embed_enabled?: BoolLike;
  demo_button_text?: string | null;

  badges?: Badge[] | Array<Record<string, unknown>> | null;

  sku?: string | null;
  stock_quantity: number;

  is_active: BoolLike;
  is_featured?: BoolLike;
  show_on_homepage?: BoolLike;
  is_digital?: BoolLike;
  requires_shipping?: BoolLike;

  epin_game_id?: string | null;
  epin_product_id?: string | null;
  auto_delivery_enabled?: BoolLike;
  pre_order_enabled?: BoolLike;

  min_order?: number | null;
  max_order?: number | null;
  min_barem?: number | null;
  max_barem?: number | null;
  barem_step?: number | null;

  tax_type?: number | null;

  file_url?: string | null;

  brand_id?: string | null;
  vendor?: string | null;
  barcode?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  weight_grams?: number | null;
  size_length_mm?: number | null;
  size_width_mm?: number | null;
  size_height_mm?: number | null;

  created_at: string;
  updated_at?: string;

  categories?: CategoryBrief;
};

/** Public product view (booleans normalized to boolean) */
export type Product = {
  id: string;
  name: string;
  slug: string;

  description: string | null;
  short_description: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;
  cost: number | null;

  image_url: string | null;
  featured_image: string | null;
  featured_image_asset_id: string | null;
  featured_image_alt: string | null;

  gallery_urls: string[] | null;
  gallery_asset_ids: string[] | null;
  features: string[] | null;

  rating: number;
  review_count: number;
  sales_count: number;

  product_type: ProductType;
  delivery_type: ProductDeliveryType | null;

  custom_fields: CustomField[] | null;
  quantity_options: QuantityOption[] | null;

  api_provider_id: string | null;
  api_product_id: string | null;
  api_quantity: number | null;

  meta_title: string | null;
  meta_description: string | null;

  article_content: string | null;
  article_enabled: boolean;

  demo_url: string | null;
  demo_embed_enabled: boolean;
  demo_button_text: string | null;

  badges: Badge[] | null;

  sku: string | null;
  stock_quantity: number;

  is_active: boolean;
  is_featured: boolean;
  requires_shipping: boolean;

  brand_id: string | null;
  vendor: string | null;
  barcode: string | null;
  gtin: string | null;
  mpn: string | null;
  weight_grams: number | null;
  size_length_mm: number | null;
  size_width_mm: number | null;
  size_height_mm: number | null;

  created_at: string;
  updated_at: string;

  categories?: CategoryBrief;
};

/* ----------------------------- API raw types ----------------------------- */

export type ApiProduct = Partial<{
  id: unknown;
  name: unknown;
  slug: unknown;

  description: unknown;
  short_description: unknown;
  category_id: unknown;

  price: unknown;
  original_price: unknown;
  compare_at_price: unknown;
  cost: unknown;

  image_url: unknown;
  featured_image: unknown;
  featured_image_asset_id: unknown;
  featured_image_alt: unknown;

  gallery_urls: unknown;
  images: unknown;
  gallery_asset_ids: unknown;
  features: unknown;

  rating: unknown;
  review_count: unknown;
  sales_count: unknown;

  product_type: unknown;
  delivery_type: unknown;

  custom_fields: unknown;
  quantity_options: unknown;

  api_provider_id: unknown;
  api_product_id: unknown;
  api_quantity: unknown;

  meta_title: unknown;
  meta_description: unknown;

  article_content: unknown;
  article_enabled: unknown;
  demo_url: unknown;
  demo_embed_enabled: unknown;
  demo_button_text: unknown;

  badges: unknown;

  sku: unknown;
  stock_quantity: unknown;

  is_active: unknown;
  is_featured: unknown;
  show_on_homepage: unknown;
  is_digital: unknown;
  requires_shipping: unknown;

  epin_game_id: unknown;
  epin_product_id: unknown;
  auto_delivery_enabled: unknown;
  pre_order_enabled: unknown;

  min_order: unknown;
  max_order: unknown;
  min_barem: unknown;
  max_barem: unknown;
  barem_step: unknown;

  tax_type: unknown;
  file_url: unknown;

  brand_id: unknown;
  vendor: unknown;
  barcode: unknown;
  gtin: unknown;
  mpn: unknown;
  weight_grams: unknown;
  size_length_mm: unknown;
  size_width_mm: unknown;
  size_height_mm: unknown;

  created_at: unknown;
  updated_at: unknown;

  categories: unknown;
}>;

/* ----------------------------- Upsert/Patch ----------------------------- */

export type UpsertProductBody = {
  name: string;
  slug: string;

  description?: string | null;
  short_description?: string | null;
  category_id?: string | null;

  price: number;
  original_price?: number | null;

  stock_quantity: number;

  image_url?: string | null;

  is_active?: boolean;
  show_on_homepage?: boolean;

  /** UI’da “Satış Sayısı” gibi kullanıyorsun; backend kabul ediyorsa yazılabilir olmalı */
  review_count?: number;
  sales_count?: number;

  // İstersen sonradan genişletirsin:
  // delivery_type?: ProductDeliveryType | null;
  // ...
};

export type PatchProductBody = Partial<UpsertProductBody>;

/* ----------------------------- list params ----------------------------- */

export type ProductsAdminListParams = {
  q?: string;
  category_id?: string;
  is_active?: boolean;
  show_on_homepage?: boolean;

  min_price?: number;
  max_price?: number;

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'price' | 'name' | 'review_count' | 'rating';
  order?: 'asc' | 'desc';
};

export function toProductsAdminListQuery(
  p?: ProductsAdminListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;
  const out: QueryParams = {};

  if (p.q) out.q = p.q;
  if (p.category_id) out.category_id = p.category_id;

  if (typeof p.is_active === 'boolean') out.is_active = p.is_active ? 1 : 0;
  if (typeof p.show_on_homepage === 'boolean') out.show_on_homepage = p.show_on_homepage ? 1 : 0;

  if (typeof p.min_price === 'number') out.min_price = p.min_price;
  if (typeof p.max_price === 'number') out.max_price = p.max_price;

  if (typeof p.limit === 'number') out.limit = clamp(p.limit, 1, 200);
  if (typeof p.offset === 'number') out.offset = Math.max(0, Math.trunc(p.offset));

  if (p.sort) out.sort = p.sort;
  if (p.order) out.order = p.order;

  return Object.keys(out).length ? out : undefined;
}

/* ----------------------------- normalizers ----------------------------- */

function normalizeCategoryBrief(x: unknown): CategoryBrief | undefined {
  if (!isObject(x)) return undefined;
  const xr = x as Record<string, unknown>;
  const id = trimStr(xr.id);
  const name = trimStr(xr.name);
  const slug = trimStr(xr.slug);
  if (!id || !name) return undefined;
  return { id, name, slug };
}

export function normalizeProductAdmin(row: unknown): ProductAdmin {
  const p: ApiProduct = isObject(row) ? (row as ApiProduct) : {};

  const gallery_urls = toStrArrayOrNull(p.gallery_urls) ?? toStrArrayOrNull(p.images);
  const gallery_asset_ids = toStrArrayOrNull(p.gallery_asset_ids);
  const features = toStrArrayOrNull(p.features);

  const name = trimStr(p.name);
  const image_url = nullify(p.image_url);
  const featured_image = nullify(p.featured_image) ?? image_url;

  const created_at = trimStr(p.created_at);
  const updated_at = trimStr(p.updated_at);

  const categories = normalizeCategoryBrief(p.categories);

  const rating = toNum(p.rating ?? 0);
  const review_count = toNum(p.review_count ?? 0);

  const sales_count = toNum((p as { sales_count?: unknown }).sales_count ?? 0);


  return {
    id: trimStr(p.id),
    name,
    slug: trimStr(p.slug),

    description: nullify(p.description),
    short_description: nullify(p.short_description),
    category_id: nullify(p.category_id),

    price: toNum(p.price),
    original_price: toNumOrNull(p.original_price ?? p.compare_at_price),
    cost: toNumOrNull(p.cost),

    image_url,
    featured_image,
    featured_image_asset_id: nullify(p.featured_image_asset_id),
    featured_image_alt: nullify(p.featured_image_alt) ?? (name ? name : null),

    gallery_urls,
    gallery_asset_ids,
    features,

    rating,
    review_count,
    sales_count,

    product_type: (nullify(p.product_type) ?? null) as ProductType,
    delivery_type: (nullify(p.delivery_type) ?? null) as ProductDeliveryType | null,

    custom_fields: (p.custom_fields as ProductAdmin['custom_fields']) ?? null,
    quantity_options: (p.quantity_options as ProductAdmin['quantity_options']) ?? null,

    api_provider_id: nullify(p.api_provider_id),
    api_product_id: nullify(p.api_product_id),
    api_quantity: toNumOrNull(p.api_quantity),

    meta_title: nullify(p.meta_title),
    meta_description: nullify(p.meta_description),

    article_content: nullify(p.article_content),
    article_enabled: toBool(asBoolLike(p.article_enabled)) ? 1 : 0,

    demo_url: nullify(p.demo_url),
    demo_embed_enabled: toBool(asBoolLike(p.demo_embed_enabled)) ? 1 : 0,
    demo_button_text: nullify(p.demo_button_text),

    badges: (p.badges as ProductAdmin['badges']) ?? null,

    sku: nullify(p.sku),
    stock_quantity: toNum(p.stock_quantity ?? 0),

    is_active: toBool(asBoolLike(p.is_active)) ? 1 : 0,
    is_featured: toBool(asBoolLike(p.is_featured)) ? 1 : 0,
    show_on_homepage: toBool(asBoolLike(p.show_on_homepage)) ? 1 : 0,
    is_digital: toBool(asBoolLike(p.is_digital), true) ? 1 : 0,
    requires_shipping: toBool(asBoolLike(p.requires_shipping)) ? 1 : 0,

    epin_game_id: nullify(p.epin_game_id),
    epin_product_id: nullify(p.epin_product_id),
    auto_delivery_enabled: toBool(asBoolLike(p.auto_delivery_enabled)) ? 1 : 0,
    pre_order_enabled: toBool(asBoolLike(p.pre_order_enabled)) ? 1 : 0,

    min_order: toNumOrNull(p.min_order),
    max_order: toNumOrNull(p.max_order),
    min_barem: toNumOrNull(p.min_barem),
    max_barem: toNumOrNull(p.max_barem),
    barem_step: toNumOrNull(p.barem_step),

    tax_type: toNumOrNull(p.tax_type),

    file_url: nullify(p.file_url),

    brand_id: nullify(p.brand_id),
    vendor: nullify(p.vendor),
    barcode: nullify(p.barcode),
    gtin: nullify(p.gtin),
    mpn: nullify(p.mpn),
    weight_grams: toNumOrNull(p.weight_grams),
    size_length_mm: toNumOrNull(p.size_length_mm),
    size_width_mm: toNumOrNull(p.size_width_mm),
    size_height_mm: toNumOrNull(p.size_height_mm),

    created_at: created_at || '',
    ...(updated_at ? { updated_at } : {}),
    ...(categories ? { categories } : {}), // ✅ exactOptionalPropertyTypes fix
  };
}

export function normalizeProductPublic(row: unknown): Product {
  const a = normalizeProductAdmin(row);

  // ✅ Public tarafta "kapak" önceliği:
  // featured_image varsa onu baz al, yoksa image_url.
  const cover = a.featured_image ?? a.image_url ?? null;
  const sales = Number((row as { sales_count?: unknown }).sales_count ?? a.review_count ?? 0);

  return {
    id: a.id,
    name: a.name,
    slug: a.slug,

    description: a.description ?? null,
    short_description: a.short_description ?? null,
    category_id: a.category_id ?? null,

    price: a.price,
    original_price: a.original_price ?? null,
    cost: a.cost ?? null,

    // ✅ Kritk fix: public UI çoğu yerde image_url okuyor => cover'a eşitle
    image_url: cover,

    // featured_image alanı da cover olsun (public tarafta tutarlılık)
    featured_image: cover,

    featured_image_asset_id: a.featured_image_asset_id ?? null,
    featured_image_alt: a.featured_image_alt ?? null,

    gallery_urls: a.gallery_urls ?? null,
    gallery_asset_ids: a.gallery_asset_ids ?? null,
    features: a.features ?? null,

    rating: a.rating ?? 0,
    review_count: a.review_count ?? 0,
    sales_count: sales,
    product_type: (a.product_type ?? null) as ProductType,
    delivery_type: (a.delivery_type ?? null) as ProductDeliveryType | null,

    custom_fields: Array.isArray(a.custom_fields) ? (a.custom_fields as CustomField[]) : null,
    quantity_options: Array.isArray(a.quantity_options)
      ? (a.quantity_options as QuantityOption[])
      : null,

    api_provider_id: nullify(a.api_provider_id),
    api_product_id: nullify(a.api_product_id),
    api_quantity: a.api_quantity ?? null,

    meta_title: a.meta_title ?? null,
    meta_description: a.meta_description ?? null,

    article_content: a.article_content ?? null,
    article_enabled: toBool(a.article_enabled),

    demo_url: a.demo_url ?? null,
    demo_embed_enabled: toBool(a.demo_embed_enabled),
    demo_button_text: a.demo_button_text ?? null,

    badges: Array.isArray(a.badges) ? (a.badges as Badge[]) : null,

    sku: a.sku ?? null,
    stock_quantity: toNum(a.stock_quantity ?? 0),

    is_active: toBool(a.is_active),
    is_featured: toBool(a.is_featured),
    requires_shipping: toBool(a.requires_shipping),

    brand_id: nullify(a.brand_id),
    vendor: nullify(a.vendor),
    barcode: nullify(a.barcode),
    gtin: nullify(a.gtin),
    mpn: nullify(a.mpn),
    weight_grams: a.weight_grams ?? null,
    size_length_mm: a.size_length_mm ?? null,
    size_width_mm: a.size_width_mm ?? null,
    size_height_mm: a.size_height_mm ?? null,

    created_at: a.created_at,
    updated_at: a.updated_at ?? a.created_at,

    ...(a.categories ? { categories: a.categories } : {}),
  };
}

export function normalizeProductsAdmin(res: unknown): ProductAdmin[] {
  return extractArray(res).map((x) => normalizeProductAdmin(x));
}

export function normalizeProductsPublic(res: unknown): Product[] {
  return extractArray(res).map((x) => normalizeProductPublic(x));
}

/* ----------------------------- results ----------------------------- */

export type ProductsListResult = { items: Product[]; total: number };

export function normalizeProductsPublicWithMeta(res: unknown): ProductsListResult {
  const items = normalizeProductsPublic(res);
  const total = extractTotal(res);
  return { items, total: total ?? items.length };
}

/* ----------------------------- other domain types used by endpoints ----------------------------- */

export type ApiProviderRow = {
  id: string;
  name: string;
  is_active: BoolLike;
};

/* ----------------------------- body mapper ----------------------------- */

export function toProductApiBody(
  body: UpsertProductBody | PatchProductBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const has = <K extends string>(k: K): boolean =>
    Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, k);

  const b = body as Record<string, unknown>;

  if (has('name')) out.name = trimStr(b.name);
  if (has('slug')) out.slug = trimStr(b.slug);

  if (has('description')) out.description = b.description ?? null;
  if (has('short_description')) out.short_description = b.short_description ?? null;
  if (has('category_id')) out.category_id = b.category_id ?? null;

  if (has('price')) out.price = toNum(b.price, 0);

  if (has('original_price')) {
    out.original_price = b.original_price == null ? null : toNum(b.original_price, 0);
  }

  if (has('stock_quantity')) out.stock_quantity = toNum(b.stock_quantity, 0);

  if (has('image_url')) out.image_url = b.image_url ?? null;

  if (has('is_active')) out.is_active = !!b.is_active;
  if (has('show_on_homepage')) out.show_on_homepage = !!b.show_on_homepage;

  if (has('review_count')) out.review_count = toNum(b.review_count, 0);
  if (has('sales_count')) {
    const n = b.sales_count == null ? null : toNum(b.sales_count, 0);
    out.sales_count = n;
    out.review_count = n;
  } else if (has('review_count')) {
    out.review_count = b.review_count == null ? null : toNum(b.review_count, 0);
  }

  return out;
}

// ProductsPublicListParams içine ekle:
export type ProductsPublicListParams = Omit<
  ProductsAdminListParams,
  'show_on_homepage' | 'sort'
> & {
  sort?: 'price' | 'rating' | 'created_at';
  slug?: string;
  ids?: string[];

  // ✅ add
  is_featured?: boolean;
};

// toProductsPublicListQuery içine ekle:
export function toProductsPublicListQuery(
  p?: ProductsPublicListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;
  const out: QueryParams = {};

  if (p.q) out.q = p.q;
  if (p.category_id) out.category_id = p.category_id;

  if (typeof p.is_active === 'boolean') out.is_active = p.is_active ? 1 : 0;

  // ✅ add
  if (typeof p.is_featured === 'boolean') out.is_featured = p.is_featured ? 1 : 0;

  // ... kalanlar aynı
  // min/max, limit/offset, sort/order, slug, ids
  return Object.keys(out).length ? out : undefined;
}

/* ----------------------------- Admin create/update body (backend contract) ----------------------------- */

export type ProductJsonPrimitive = string | number | boolean | null;
export type ProductJsonValue =
  | ProductJsonPrimitive
  | ProductJsonValue[]
  | { [k: string]: ProductJsonValue };

export type Badge = { text: string; icon?: string | null; active: boolean };

export type CustomField = {
  id?: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'textarea';
  placeholder?: string | null;
  required: boolean;
};

export type QuantityOption = { quantity: number; price: number };

export type ProductDeliveryType = 'manual' | 'auto_stock' | 'file' | 'api' | (string & {});
export type ProductType = string | null;

/**
 * Backend: productCreateSchema + products table alanları
 * - create: name/slug/price zorunlu; diğerleri opsiyonel
 * - admin.controller: review_count create/update'da raw body'den ayrıca okunuyor (biz de göndereceğiz)
 */
export type CommonProductPayload = {
  // identity
  id?: string;

  // core
  name: string;
  slug: string;

  description?: string | null;
  short_description?: string | null;

  category_id?: string | null;

  price: number;
  original_price?: number | null;
  cost?: number | null;

  // legacy + storage
  image_url?: string | null;

  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;

  gallery_urls?: string[] | null;
  gallery_asset_ids?: string[] | null;

  // NOTE: backend schema: features json (Record|unknown[]). Validation: z.array(z.string())
  // Biz FE tarafında string[] tutacağız.
  features?: string[] | null;

  // rating/reviews
  rating?: number; // backend create schema: optional (0..5)
  review_count?: number; // backend create/update: raw accept
  sales_count?: number; // backend create/update: raw accept

  // types
  product_type?: ProductType;
  delivery_type?: ProductDeliveryType | null;

  // json payloads
  custom_fields?: CustomField[] | Array<Record<string, unknown>> | null;
  quantity_options?: QuantityOption[] | Array<Record<string, unknown>> | null;
  badges?: Badge[] | Array<Record<string, unknown>> | null;

  // api fields
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;

  // seo/article/demo
  meta_title?: string | null;
  meta_description?: string | null;

  article_content?: string | null;
  article_enabled?: boolean | 0 | 1;

  demo_url?: string | null;
  demo_embed_enabled?: boolean | 0 | 1;
  demo_button_text?: string | null;

  // stock
  sku?: string | null;
  stock_quantity?: number;

  // flags
  is_active?: boolean | 0 | 1;
  show_on_homepage?: boolean; // FE alias -> backend is_featured
  is_featured?: boolean | 0 | 1; // opsiyonel: direkt yazmak istersen
  requires_shipping?: boolean | 0 | 1;
  is_digital?: boolean | 0 | 1;

  // delivery/other
  auto_delivery_enabled?: boolean | 0 | 1;
  pre_order_enabled?: boolean | 0 | 1;

  min_order?: number | null;
  max_order?: number | null;
  min_barem?: number | null;
  max_barem?: number | null;
  barem_step?: number | null;
  tax_type?: number | null;

  // extra columns in DDL
  file_url?: string | null;
  epin_game_id?: string | null;
  epin_product_id?: string | null;
};

/** Create body: backend name/slug/price require; diğerleri opsiyonel */
export type CreateProductBody = CommonProductPayload;

/** Update body: PATCH => partial */
export type UpdateProductBody = Partial<CommonProductPayload>;

/* ----------------------------- admin body mapper ----------------------------- */

function tryParseJsonLoose(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!s) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function to01(v: unknown): 0 | 1 {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  return 0;
}

export function toProductAdminApiBody(
  body: CreateProductBody | UpdateProductBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const b = body as Record<string, unknown>;

  const has = (k: string): boolean => Object.prototype.hasOwnProperty.call(b, k);

  // identity
  if (has('id')) out.id = trimStr(b.id);

  // core required-ish
  if (has('name')) out.name = trimStr(b.name);
  if (has('slug')) out.slug = trimStr(b.slug);

  if (has('description')) out.description = b.description ?? null;
  if (has('short_description')) out.short_description = b.short_description ?? null;
  if (has('category_id')) out.category_id = b.category_id ?? null;

  if (has('price')) out.price = toNum(b.price, 0);
  if (has('original_price'))
    out.original_price = b.original_price == null ? null : toNum(b.original_price, 0);
  if (has('cost')) out.cost = b.cost == null ? null : toNum(b.cost, 0);

  // legacy + storage
  if (has('image_url')) out.image_url = b.image_url ?? null;

  if (has('featured_image')) out.featured_image = b.featured_image ?? null;
  if (has('featured_image_asset_id'))
    out.featured_image_asset_id = b.featured_image_asset_id ?? null;
  if (has('featured_image_alt')) out.featured_image_alt = b.featured_image_alt ?? null;

  if (has('gallery_urls')) out.gallery_urls = tryParseJsonLoose(b.gallery_urls) ?? null;
  if (has('gallery_asset_ids'))
    out.gallery_asset_ids = tryParseJsonLoose(b.gallery_asset_ids) ?? null;

  if (has('features')) out.features = tryParseJsonLoose(b.features) ?? null;

  // rating / review_count
  if (has('rating')) out.rating = b.rating == null ? null : toNum(b.rating, 0);
  if (has('review_count'))
    out.review_count = b.review_count == null ? null : toNum(b.review_count, 0);
  if (has('sales_count')) out.sales_count = b.sales_count == null ? null : toNum(b.sales_count, 0);

  // types
  if (has('product_type')) out.product_type = b.product_type ?? null;
  if (has('delivery_type')) out.delivery_type = b.delivery_type ?? null;

  // json payloads
  if (has('custom_fields')) out.custom_fields = tryParseJsonLoose(b.custom_fields) ?? null;
  if (has('quantity_options')) out.quantity_options = tryParseJsonLoose(b.quantity_options) ?? null;
  if (has('badges')) out.badges = tryParseJsonLoose(b.badges) ?? null;

  // api fields
  if (has('api_provider_id')) out.api_provider_id = b.api_provider_id ?? null;
  if (has('api_product_id')) out.api_product_id = b.api_product_id ?? null;
  if (has('api_quantity'))
    out.api_quantity = b.api_quantity == null ? null : toNum(b.api_quantity, 0);

  // seo/article/demo
  if (has('meta_title')) out.meta_title = b.meta_title ?? null;
  if (has('meta_description')) out.meta_description = b.meta_description ?? null;

  if (has('article_content')) out.article_content = b.article_content ?? null;
  if (has('article_enabled')) out.article_enabled = to01(b.article_enabled);

  if (has('demo_url')) out.demo_url = b.demo_url ?? null;
  if (has('demo_embed_enabled')) out.demo_embed_enabled = to01(b.demo_embed_enabled);
  if (has('demo_button_text')) out.demo_button_text = b.demo_button_text ?? null;

  // stock
  if (has('sku')) out.sku = b.sku ?? null;
  if (has('stock_quantity')) out.stock_quantity = toNum(b.stock_quantity, 0);

  // flags
  if (has('is_active')) out.is_active = to01(b.is_active);

  // backend flag is_featured; FE uses show_on_homepage
  if (has('show_on_homepage')) {
    const v01 = to01(b.show_on_homepage);
    out.is_featured = v01; // ✅ asıl alan
    out.show_on_homepage = v01; // ✅ varsa backend de kabul etsin diye (compat)
  }
  if (has('is_featured')) {
    const v01 = to01(b.is_featured);
    out.is_featured = v01;
    // compat
    if (!has('show_on_homepage')) out.show_on_homepage = v01;
  }

  if (has('requires_shipping')) out.requires_shipping = to01(b.requires_shipping);
  if (has('is_digital')) out.is_digital = to01(b.is_digital);

  if (has('auto_delivery_enabled')) out.auto_delivery_enabled = to01(b.auto_delivery_enabled);
  if (has('pre_order_enabled')) out.pre_order_enabled = to01(b.pre_order_enabled);

  if (has('min_order')) out.min_order = b.min_order == null ? null : toNum(b.min_order, 0);
  if (has('max_order')) out.max_order = b.max_order == null ? null : toNum(b.max_order, 0);
  if (has('min_barem')) out.min_barem = b.min_barem == null ? null : toNum(b.min_barem, 0);
  if (has('max_barem')) out.max_barem = b.max_barem == null ? null : toNum(b.max_barem, 0);
  if (has('barem_step')) out.barem_step = b.barem_step == null ? null : toNum(b.barem_step, 0);
  if (has('tax_type')) out.tax_type = b.tax_type == null ? null : toNum(b.tax_type, 0);

  // extra ddl fields
  if (has('file_url')) out.file_url = b.file_url ?? null;
  if (has('epin_game_id')) out.epin_game_id = b.epin_game_id ?? null;
  if (has('epin_product_id')) out.epin_product_id = b.epin_product_id ?? null;

  return out;
}
