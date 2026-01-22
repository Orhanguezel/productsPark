// =============================================================
// FILE: src/integrations/types/blog.ts
// FINAL — Blog types + helpers + normalizers (central types barrel)
// - ADD: meta_title/meta_description mapping
// - FIX: list normalizer accepts array OR {data:[]}
// - tolerant featured flag resolver
// - exactOptionalPropertyTypes friendly mappers (undefined göndermeyiz)
// =============================================================

import { isUnknownRow, toStr } from '@/integrations/types';
import type { BoolLike, SortOrder } from '@/integrations/types';

/* -------------------- types -------------------- */

export type BlogListParams = {
  q?: string;
  is_published?: BoolLike;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at' | 'published_at' | 'title';
  order?: SortOrder;
};

export type ApiBlogPost = Record<string, unknown>;

export type BlogPost = {
  id: string;

  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;

  // ✅ DB: blog_posts.category (nullable)
  category: string | null;

  // ✅ (optional/legacy) - backend kolonu yoksa 0 gelir
  display_order: number;

  image_url: string | null; // maps: featured_image
  image_asset_id: string | null; // maps: featured_image_asset_id
  image_alt: string | null; // maps: featured_image_alt

  author_name: string | null; // maps: author

  // ✅ SEO
  meta_title: string | null;
  meta_description: string | null;

  is_published: boolean;
  is_featured: boolean;

  created_at: string;
  updated_at: string;
  published_at: string | null;

  // derived
  read_time: string;
};

export type UpsertBlogBody = {
  title: string;
  slug?: string;

  excerpt?: string | null;
  content?: string | null;

  category?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  author_name?: string | null;

  // ✅ SEO
  meta_title?: string | null;
  meta_description?: string | null;

  is_published?: BoolLike;
  is_featured?: BoolLike;

  // ⚠️ Backend zod schema’nızda display_order yoksa bunu göndermeyin.
  // Eğer backend’e eklerseniz mapper zaten gönderir.
  display_order?: number | null;
};

/* -------------------- helpers -------------------- */

function toOptStr(v: unknown): string | null {
  if (v == null) return null;
  const s = toStr(v).trim();
  return s ? s : null;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  }
  return false;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

function computeReadTime(content: string | null): string {
  const text = stripHtml(content ?? '').trim();
  if (!text) return '1 dk';
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} dk`;
}

function pickFeaturedFlag(r: Record<string, unknown>): boolean {
  if (typeof r.is_featured !== 'undefined') return toBool(r.is_featured);
  if (typeof r.featured !== 'undefined') return toBool(r.featured);
  if (typeof (r as Record<string, unknown>).isFeatured !== 'undefined')
    return toBool((r as Record<string, unknown>).isFeatured);
  return false;
}


export type PageState = 'loading' | 'error' | 'empty' | 'ready';

export const text = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

export const hasText = (v: unknown): boolean => text(v).trim().length > 0;

export const nonEmpty = (v: unknown): string => {
  const s = text(v).trim();
  return s ? s : '';
};

// IMPORTANT: img src must be string | undefined (never null)
export const imgSrc = (v: unknown): string | undefined => {
  const s = nonEmpty(v);
  return s ? s : undefined;
};

export const getOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
};

export const formatDateTR = (dateString?: string | null): string => {
  const s = nonEmpty(dateString);
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const pickFeatured = (all: BlogPost[]): BlogPost | null => {
  if (!all.length) return null;
  return all.find((p) => !!p.is_featured) ?? all[0] ?? null;
};

/* -------------------- normalizers -------------------- */

export function normalizeBlogPost(row: unknown): BlogPost {
  const r = isUnknownRow(row) ? row : {};

  const excerpt = toOptStr(r.excerpt);
  const content = toOptStr(r.content);

  const category = toOptStr(
    (r as Record<string, unknown>).category ?? (r as Record<string, unknown>).category_slug ?? null,
  );

  const display_order_raw =
    (r as Record<string, unknown>).display_order ??
    (r as Record<string, unknown>).displayOrder ??
    0;
  const display_order = toNum(display_order_raw);

  const image_url = toOptStr((r as Record<string, unknown>).featured_image ?? r.image_url);
  const image_asset_id = toOptStr(
    (r as Record<string, unknown>).featured_image_asset_id ?? r.image_asset_id,
  );
  const image_alt = toOptStr((r as Record<string, unknown>).featured_image_alt ?? r.image_alt);

  const author_name = toOptStr((r as Record<string, unknown>).author ?? r.author_name);

  const meta_title = toOptStr((r as Record<string, unknown>).meta_title);
  const meta_description = toOptStr((r as Record<string, unknown>).meta_description);

  const is_published = toBool((r as Record<string, unknown>).is_published);
  const is_featured = pickFeaturedFlag(r);

  const created_at = toStr((r as Record<string, unknown>).created_at ?? '');
  const updated_at = toStr((r as Record<string, unknown>).updated_at ?? '');
  const published_at = toOptStr((r as Record<string, unknown>).published_at);

  return {
    id: toStr((r as Record<string, unknown>).id),

    title: toStr((r as Record<string, unknown>).title ?? ''),
    slug: toStr((r as Record<string, unknown>).slug ?? ''),
    excerpt,
    content,

    category,
    display_order,

    image_url,
    image_asset_id,
    image_alt,

    author_name,

    meta_title,
    meta_description,

    is_published,
    is_featured,

    created_at,
    updated_at,
    published_at,

    read_time: computeReadTime(content),
  };
}

/** List response tolerant: Faqs'ta yaptığımız gibi */
export function normalizeBlogPostList(res: unknown): BlogPost[] {
  if (Array.isArray(res)) return res.map(normalizeBlogPost);

  if (res && typeof res === 'object') {
    const data = (res as { data?: unknown }).data;
    if (Array.isArray(data)) return data.map(normalizeBlogPost);
  }

  return [];
}

/* -------------------- query builders -------------------- */

export function toBlogListQuery(params?: BlogListParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();

  if (params.q) sp.set('q', params.q);
  if (typeof params.limit === 'number') sp.set('limit', String(params.limit));
  if (typeof params.offset === 'number') sp.set('offset', String(params.offset));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);

  if (typeof params.is_published !== 'undefined') {
    const v = params.is_published;
    if (v === true) sp.set('is_published', '1');
    else if (v === false) sp.set('is_published', '0');
    else sp.set('is_published', toStr(v));
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/* -------------------- body mapper -------------------- */


export function toBlogUpsertApiBody(b: UpsertBlogBody): Record<string, unknown> {
  const out: Record<string, unknown> = {
    title: (b.title ?? '').trim(),
  };

  if (typeof b.slug !== 'undefined') {
    const s = (b.slug ?? '').trim();
    if (s) out.slug = s;
  }

  if (typeof b.excerpt !== 'undefined') out.excerpt = b.excerpt;
  if (typeof b.content !== 'undefined') out.content = b.content;

  if (typeof b.category !== 'undefined') out.category = b.category;

  if (typeof b.display_order !== 'undefined') out.display_order = b.display_order;

  if (typeof b.image_url !== 'undefined') out.featured_image = b.image_url;
  if (typeof b.image_asset_id !== 'undefined') out.featured_image_asset_id = b.image_asset_id;
  if (typeof b.image_alt !== 'undefined') out.featured_image_alt = b.image_alt;

  if (typeof b.author_name !== 'undefined') out.author = b.author_name;

  if (typeof b.meta_title !== 'undefined') out.meta_title = b.meta_title;
  if (typeof b.meta_description !== 'undefined') out.meta_description = b.meta_description;

  if (typeof b.is_published !== 'undefined') out.is_published = !!b.is_published;
  if (typeof b.is_featured !== 'undefined') out.is_featured = toBool(b.is_featured);

  return out;
}




