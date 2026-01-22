// =============================================================
// FILE: src/integrations/types/customPages.ts
// FINAL — Custom Pages types + helpers + normalizers (central barrel)
// =============================================================

import { SortOrder, isUnknownRow, toStr } from '@/integrations/types';

/* -------------------- types -------------------- */

export type CustomPagesAdminOrderBy = 'created_at' | 'updated_at';

export type CustomPageRow = Record<string, unknown>;

/**
 * UI’nın kullanacağı normalize edilmiş görünüm
 * Not: Görsel alanlarını tek standarda indirdik.
 */
export type CustomPageView = {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  meta_title: string | null;
  meta_description: string | null;

  is_published: boolean;

  created_at?: string;
  updated_at?: string;
};


export type AboutPageContent = {
  hero_kicker?: string;
  hero_title?: string;
  hero_lead?: string;

  story_title?: string;
  story_p1?: string;
  story_p2?: string;
  story_p3?: string;

  values_title?: string;
  values?: Array<{ icon?: string; title?: string; text?: string }>;

  stats?: Array<{ value?: string; label?: string; variant?: 'primary' | 'secondary' | 'accent' }>;

  mission_title?: string;
  mission_text?: string;
};



/** Admin create body (FE -> BE) */
export type UpsertCustomPageBody = {
  title: string;
  slug: string;
  content: string;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;

  is_published?: boolean;
  locale?: string | null;
};

/** Admin patch body (partial) */
export type PatchCustomPageBody = Partial<UpsertCustomPageBody>;

/** Admin list params */
export type CustomPagesAdminListParams = {
  limit?: number;
  offset?: number;
  q?: string;
  slug?: string;
  sort?: CustomPagesAdminOrderBy;
  orderDir?: SortOrder;
  is_published?: boolean;
};

/** Public list params (backend-aligned) */
export type CustomPagesPublicListParams = {
  is_published?: boolean | 0 | 1;
  limit?: number;
  offset?: number;

  q?: string;
  slug?: string;
  module_key?: string;
  author_id?: string;

  tag?: string;
  tags?: string; // "a,b" or json; backend parses
};

/* -------------------- helpers -------------------- */

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

function toOptStr(v: unknown): string | null {
  if (v == null) return null;
  const s = toStr(v).trim();
  return s ? s : null;
}

/**
 * content alanı:
 * - string html
 * - JSON string {"html": "..."}
 * - object { html: "..." }
 */
export function extractHtml(rawField: unknown): string {
  if (typeof rawField === 'string') {
    const s = rawField;
    // JSON string olabilir
    try {
      const parsed: unknown = JSON.parse(s);
      if (isUnknownRow(parsed) && typeof parsed.html === 'string') return parsed.html;
    } catch {
      // ignore
    }
    return s;
  }

  if (isUnknownRow(rawField) && typeof rawField.html === 'string') return rawField.html;

  return '';
}

/**
 * BE farklı isimlerle döndürebilir:
 * - image_url / storage_asset_id / alt  (admin)
 * - featured_image / featured_image_asset_id / featured_image_alt (eski)
 * - image_effective_url gibi türevler
 *
 * Bu mapping TEK yerde.
 */
function pickImageFields(r: Record<string, unknown>): {
  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;
} {
  const url =
    toOptStr(r.image_url) ?? toOptStr(r.image_effective_url) ?? toOptStr(r.featured_image) ?? null;

  const assetId =
    toOptStr(r.storage_asset_id) ??
    toOptStr(r.featured_image_asset_id) ??
    toOptStr(r.image_asset_id) ??
    null;

  const alt = toOptStr(r.alt) ?? toOptStr(r.featured_image_alt) ?? toOptStr(r.image_alt) ?? null;

  return { image_url: url, image_asset_id: assetId, image_alt: alt };
}

/* -------------------- normalizers -------------------- */

/** Row -> View (no-any, strict-safe) */
export function normalizeCustomPage(row: unknown): CustomPageView {
  const r = isUnknownRow(row) ? row : {};

  const { image_url, image_asset_id, image_alt } = pickImageFields(r);

  const created_at = typeof r.created_at === 'string' ? r.created_at : undefined;
  const updated_at = typeof r.updated_at === 'string' ? r.updated_at : undefined;

  const view: CustomPageView = {
    id: toStr(r.id),
    title: toStr(r.title),
    slug: toStr(r.slug),
    content: extractHtml(r.content_html ?? r.content),

    image_url,
    image_asset_id,
    image_alt,

    meta_title: toOptStr(r.meta_title),
    meta_description: toOptStr(r.meta_description),

    is_published: toBool(r.is_published),

    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };

  return view;
}

/* -------------------- api body builders -------------------- */

/** Create body -> backend schema (content: JSON string) */
export function toCustomPageApiBody(b: UpsertCustomPageBody): Record<string, unknown> {
  const title = (b.title ?? '').trim();
  const slug = (b.slug ?? '').trim();
  const html = b.content ?? '';
  const is_published = toBool(b.is_published);

  const out: Record<string, unknown> = {
    title,
    slug,
    content: JSON.stringify({ html }),
    is_published,
  };

  if (typeof b.image_url !== 'undefined') out.image_url = b.image_url;
  if (typeof b.image_asset_id !== 'undefined') out.storage_asset_id = b.image_asset_id;
  if (typeof b.image_alt !== 'undefined') out.alt = b.image_alt;

  if (typeof b.meta_title !== 'undefined') out.meta_title = b.meta_title;
  if (typeof b.meta_description !== 'undefined') out.meta_description = b.meta_description;

  if (typeof b.locale !== 'undefined') out.locale = b.locale;

  return out;
}

/** Patch body -> only provided fields */
export function toCustomPageApiPatchBody(b: PatchCustomPageBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof b.title !== 'undefined') out.title = (b.title ?? '').trim();
  if (typeof b.slug !== 'undefined') out.slug = (b.slug ?? '').trim();

  if (typeof b.content !== 'undefined') out.content = JSON.stringify({ html: b.content ?? '' });

  if (typeof b.image_url !== 'undefined') out.image_url = b.image_url;
  if (typeof b.image_asset_id !== 'undefined') out.storage_asset_id = b.image_asset_id;
  if (typeof b.image_alt !== 'undefined') out.alt = b.image_alt;

  if (typeof b.meta_title !== 'undefined') out.meta_title = b.meta_title;
  if (typeof b.meta_description !== 'undefined') out.meta_description = b.meta_description;

  if (typeof b.is_published !== 'undefined') out.is_published = toBool(b.is_published);
  if (typeof b.locale !== 'undefined') out.locale = b.locale;

  return out;
}

/* -------------------- query builders -------------------- */

export function buildCustomPagesAdminListQuery(p?: CustomPagesAdminListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));
  if (p.q) sp.set('q', p.q);
  if (p.slug) sp.set('slug', p.slug);
  if (p.sort) sp.set('sort', p.sort);
  if (p.orderDir) sp.set('orderDir', p.orderDir);
  if (typeof p.is_published === 'boolean') sp.set('is_published', p.is_published ? '1' : '0');

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function buildCustomPagesPublicListQuery(p?: CustomPagesPublicListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (typeof p.is_published !== 'undefined') sp.set('is_published', String(p.is_published));
  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));

  if (p.q) sp.set('q', p.q);
  if (p.slug) sp.set('slug', p.slug);
  if (p.module_key) sp.set('module_key', p.module_key);
  if (p.author_id) sp.set('author_id', p.author_id);

  if (p.tag) sp.set('tag', p.tag);
  if (p.tags) sp.set('tags', p.tags);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
