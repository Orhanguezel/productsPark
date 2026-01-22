// =============================================================
// FILE: src/integrations/types/categories.ts
// FINAL — Category types + helpers + normalizers (central types barrel)
// =============================================================

import { isUnknownRow } from '@/integrations/types';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  icon: string | null;
  parent_id: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  seo_title: string | null;
  seo_description: string | null;

  article_enabled: boolean | null;
  article_content: string | null;

  created_at: string | null;
  updated_at: string | null;
};

export type ApiCategory = Record<string, unknown>;

export type UpsertCategoryBody = {
  name: string;
  slug?: string;
  description?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  icon?: string | null;
  parent_id?: string | null;

  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;

  seo_title?: string | null;
  seo_description?: string | null;

  article_enabled?: boolean | null;
  article_content?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
};

export type CategoryListParams = {
  q?: string;
  parent_id?: string | null; // null => root
  is_active?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'name' | 'created_at' | 'updated_at';
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

function toBoolLoose(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = toStr(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'active', 'enabled'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'inactive', 'disabled'].includes(s)) return false;
  return fallback;
}

function slugify(v: string): string {
  return (v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickFirst(src: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    const val = src[k];
    if (val != null) return val;
  }
  return undefined;
}

function pickString(src: Record<string, unknown>, keys: readonly string[]): string | null {
  const v = pickFirst(src, keys);
  return toOptStr(v);
}

function pickNumber(src: Record<string, unknown>, keys: readonly string[], d = 0): number {
  const v = pickFirst(src, keys);
  return v == null ? d : toNum(v, d);
}

function pluckArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isUnknownRow(res)) {
    for (const k of ['data', 'items', 'rows', 'result', 'categories'] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function pickImageUrl(src: Record<string, unknown>): string | null {
  const direct = pickString(src, [
    'image_url',
    'banner_image_url',
    'featured_image',
    'cover_image_url',
    'image',
    'imageUrl',
  ]);
  if (direct) return direct;

  const img = src.image;
  if (isUnknownRow(img)) {
    const nested = pickString(img, ['url', 'src']);
    if (nested) return nested;
  }
  return null;
}

function pickSlug(src: Record<string, unknown>, name: string): string {
  const s = pickString(src, ['slug', 'category_slug', 'url_slug']);
  return s && s.length > 0 ? s : slugify(name);
}

/* -------------------- normalizers -------------------- */

export function normalizeCategory(row: unknown): Category {
  const r = isUnknownRow(row) ? row : {};

  const name = toTrimStr(r.name);
  const id = toTrimStr(r.id);

  const activeRaw = pickFirst(r, ['is_active', 'active', 'enabled', 'status']);
  const is_active = activeRaw == null ? true : toBoolLoose(activeRaw, true);

  const featuredRaw = pickFirst(r, ['is_featured', 'featured', 'isFeatured']);
  const is_featured = featuredRaw == null ? false : toBoolLoose(featuredRaw, false);

  const seo_title = pickString(r, ['seo_title', 'meta_title', 'title']) ?? null;
  const seo_description = pickString(r, ['seo_description', 'meta_description']) ?? null;

  const article_enabled =
    pickFirst(r, ['article_enabled']) == null
      ? null
      : toBoolLoose(pickFirst(r, ['article_enabled']), false);

  return {
    id,
    name,
    slug: pickSlug(r, name),
    description: (typeof r.description === 'string' ? r.description : null) ?? null,

    image_url: pickImageUrl(r),
    image_asset_id:
      pickString(r, ['image_asset_id', 'featured_image_asset_id', 'asset_id', 'imageId']) ?? null,
    image_alt: pickString(r, ['image_alt', 'alt', 'alt_text', 'altText']) ?? null,

    icon: (typeof r.icon === 'string' ? r.icon : null) ?? null,
    parent_id: pickString(r, ['parent_id', 'parentId', 'parent']) ?? null,

    is_active,
    is_featured,
    display_order: pickNumber(
      r,
      ['display_order', 'order', 'sort', 'position', 'rank', 'priority'],
      0,
    ),

    seo_title,
    seo_description,

    article_enabled,
    article_content: (typeof r.article_content === 'string' ? r.article_content : null) ?? null,

    created_at: typeof r.created_at === 'string' ? r.created_at : null,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
}

export function normalizeCategoryList(res: unknown): Category[] {
  return pluckArray(res).map((x) => normalizeCategory(x));
}

/* -------------------- query builders -------------------- */

export function toCategoriesQuery(params?: CategoryListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();

  // ✅ trim + boşsa set etme
  if (params.q && params.q.trim()) sp.set('q', params.q.trim());

  if (params.parent_id !== undefined) {
    sp.set('parent_id', params.parent_id ?? 'null');
  }

  if (params.is_active !== undefined) sp.set('is_active', params.is_active ? '1' : '0');
  if (params.is_featured !== undefined) sp.set('is_featured', params.is_featured ? '1' : '0');

  if (typeof params.limit === 'number') sp.set('limit', String(params.limit));
  if (typeof params.offset === 'number') sp.set('offset', String(params.offset));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/* -------------------- body mappers -------------------- */

export function toCategoryUpsertApiBody(body: UpsertCategoryBody): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: toTrimStr(body.name),
  };

  const rawSlug = typeof body.slug !== 'undefined' ? toTrimStr(body.slug) : '';
  out.slug = rawSlug ? rawSlug : slugify(toTrimStr(body.name));

  if (typeof body.description !== 'undefined') out.description = body.description ?? null;

  if (typeof body.image_url !== 'undefined') out.image_url = body.image_url ?? null;
  if (typeof body.image_asset_id !== 'undefined') out.image_asset_id = body.image_asset_id ?? null;
  if (typeof body.image_alt !== 'undefined') out.image_alt = body.image_alt ?? null;

  if (typeof body.icon !== 'undefined') out.icon = body.icon ?? null;
  if (typeof body.parent_id !== 'undefined') out.parent_id = body.parent_id ?? null;

  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;
  if (typeof body.is_featured !== 'undefined') out.is_featured = !!body.is_featured;
  if (typeof body.display_order !== 'undefined') out.display_order = toNum(body.display_order, 0);

  if (typeof body.seo_title !== 'undefined') out.seo_title = body.seo_title ?? null;
  if (typeof body.seo_description !== 'undefined')
    out.seo_description = body.seo_description ?? null;

  const meta_title =
    body.seo_title ?? (typeof body.meta_title !== 'undefined' ? body.meta_title : undefined);
  const meta_description =
    body.seo_description ??
    (typeof body.meta_description !== 'undefined' ? body.meta_description : undefined);

  if (typeof meta_title !== 'undefined') out.meta_title = meta_title ?? null;
  if (typeof meta_description !== 'undefined') out.meta_description = meta_description ?? null;

  if (typeof body.article_enabled !== 'undefined') out.article_enabled = body.article_enabled;
  if (typeof body.article_content !== 'undefined')
    out.article_content = body.article_content ?? null;

  return out;
}
