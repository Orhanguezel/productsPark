// =============================================================
// FILE: src/integrations/types/sliders.ts
// FINAL — Slider types + normalizers + query/body helpers
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu
// =============================================================
import { QueryParams,toStr,toNum } from '@/integrations/types';
import type { SortOrder,BoolLike } from '@/integrations/types';

/* -------------------- domain types -------------------- */

export type SliderSortBy = 'created_at' | 'updated_at' | 'display_order' | 'name';

export type SliderAdminListParams = {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: SliderSortBy;
  order?: SortOrder;
  is_active?: BoolLike;
};

export type SliderListParams = {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: SliderSortBy;
  order?: SortOrder;
};

/**
 * Backend ham satır (admin/public) — farklı field isimleri gelebilir.
 * Bu yüzden Record<string, unknown> kabul ediyoruz.
 */
export type ApiSlider = Record<string, unknown>;

/**
 * Admin View (FE normalized)
 * - image_effective_url: admin tarafında görseli güvenle göstermek için tek alan
 */
export type SliderAdminView = {
  id: string;
  uuid: string | null;

  name: string;
  slug: string;

  description: string | null;

  image_url: string | null;
  image_asset_id: string | null;

  image_effective_url: string | null; // image_url || asset_url || image_effective_url
  alt: string | null;

  buttonText: string | null;
  buttonLink: string | null;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  created_at: string | null;
  updated_at: string | null;
};

/** Public View (FE normalized) */
export type SliderPublic = {
  id: string;
  name: string;
  slug: string;

  description: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_effective_url: string | null;

  alt: string | null;

  buttonText: string | null;
  buttonLink: string | null;

  featured: boolean;
  display_order: number;

  created_at: string | null;
  updated_at: string | null;
};

export type SliderCreateInput = {
  name: string;
  slug?: string;
  description?: string | null;

  alt?: string | null;

  buttonText?: string | null;
  buttonLink?: string | null;

  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  // create sırasında ister image_url ister asset id gönderilebilir (backend toleransına göre)
  image_url?: string | null;
  image_asset_id?: string | null;
};

export type SliderUpdateInput = Partial<SliderCreateInput>;

export type SliderStatusBody = { is_active: boolean };

export type SliderReorderBody = { items: Array<{ id: string; display_order: number }> };

/** PATCH /admin/sliders/:id/image */
export type SliderSetImageBody = { asset_id?: string | null };

/* -------------------- helpers -------------------- */


const toTrimStr = (v: unknown): string => toStr(v).trim();

const toOptStr = (v: unknown): string | null => {
  const s = toTrimStr(v);
  return s ? s : null;
};



const toBoolLoose = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = toStr(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'active', 'enabled', 'featured'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'inactive', 'disabled'].includes(s)) return false;
  return fallback;
};

const pickFirst = (src: ApiSlider, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const val = src[k];
    if (val != null) return val;
  }
  return undefined;
};

const pickString = (src: ApiSlider, keys: readonly string[]): string | null => {
  const v = pickFirst(src, keys);
  return toOptStr(v);
};

const pickNumber = (src: ApiSlider, keys: readonly string[], d = 0): number => {
  const v = pickFirst(src, keys);
  return v == null ? d : toNum(v, d);
};

const pickBool = (src: ApiSlider, keys: readonly string[], fallback = false): boolean => {
  const v = pickFirst(src, keys);
  return v == null ? fallback : toBoolLoose(v, fallback);
};

function normalizeEffectiveImageUrl(r: ApiSlider): string | null {
  return (
    pickString(r, ['image_effective_url', 'effective_image_url']) ??
    pickString(r, ['asset_url', 'image_asset_url', 'cdn_url']) ??
    pickString(r, ['image_url', 'image', 'featured_image', 'cover_image_url'])
  );
}

/* -------------------- normalizers -------------------- */

export function normalizeSliderAdmin(row: unknown): SliderAdminView {
  const r: ApiSlider = row && typeof row === 'object' ? (row as ApiSlider) : {};

  const name = pickString(r, ['name', 'title']) ?? '';
  const slug = pickString(r, ['slug']) ?? '';

  return {
    id: toTrimStr(pickFirst(r, ['id'])),
    uuid: pickString(r, ['uuid']) ?? null,

    name: name ?? '',
    slug: slug ?? '',

    description: pickString(r, ['description', 'content', 'body']) ?? null,

    image_url: pickString(r, ['image_url', 'image']) ?? null,
    image_asset_id: pickString(r, ['image_asset_id', 'asset_id', 'imageId']) ?? null,

    image_effective_url: normalizeEffectiveImageUrl(r),

    alt: pickString(r, ['alt', 'image_alt']) ?? null,

    buttonText: pickString(r, ['buttonText', 'button_text', 'cta_text']) ?? null,
    buttonLink: pickString(r, ['buttonLink', 'button_link', 'cta_link', 'link']) ?? null,

    featured: pickBool(r, ['featured', 'is_featured'], false),
    is_active: pickBool(r, ['is_active', 'active', 'enabled', 'status'], true),

    display_order: pickNumber(r, ['display_order', 'order', 'position', 'rank'], 0),

    created_at: pickString(r, ['created_at', 'createdAt']) ?? null,
    updated_at: pickString(r, ['updated_at', 'updatedAt']) ?? null,
  };
}

export function normalizeSliderPublic(row: unknown): SliderPublic {
  const a = normalizeSliderAdmin(row);
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    description: a.description,

    image_url: a.image_url,
    image_asset_id: a.image_asset_id,
    image_effective_url: a.image_effective_url,

    alt: a.alt,

    buttonText: a.buttonText,
    buttonLink: a.buttonLink,

    featured: a.featured,
    display_order: a.display_order,

    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

export function normalizeSliderAdminList(res: unknown): SliderAdminView[] {
  if (Array.isArray(res)) return (res as unknown[]).map(normalizeSliderAdmin);

  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    for (const k of ['data', 'items', 'rows', 'result', 'sliders'] as const) {
      const v = o[k];
      if (Array.isArray(v)) return (v as unknown[]).map(normalizeSliderAdmin);
    }
  }
  return [];
}

export function normalizeSliderPublicList(res: unknown): SliderPublic[] {
  if (Array.isArray(res)) return (res as unknown[]).map(normalizeSliderPublic);

  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    for (const k of ['data', 'items', 'rows', 'result', 'sliders'] as const) {
      const v = o[k];
      if (Array.isArray(v)) return (v as unknown[]).map(normalizeSliderPublic);
    }
  }
  return [];
}

/* -------------------- query builders -------------------- */

export function toSlidersAdminQuery(p?: SliderAdminListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.q) q.q = p.q;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  if (typeof p.is_active === 'boolean') q.is_active = p.is_active;

  return Object.keys(q).length ? q : undefined;
}

export function toSlidersPublicQuery(p?: SliderListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.q) q.q = p.q;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}

/* -------------------- body mappers -------------------- */

export function toSliderCreateApiBody(body: SliderCreateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: toTrimStr(body.name),
  };

  if (typeof body.slug !== 'undefined') out.slug = body.slug ? toTrimStr(body.slug) : '';
  if (typeof body.description !== 'undefined') out.description = body.description ?? null;

  if (typeof body.alt !== 'undefined') out.alt = body.alt ?? null;

  if (typeof body.buttonText !== 'undefined') out.buttonText = body.buttonText ?? null;
  if (typeof body.buttonLink !== 'undefined') out.buttonLink = body.buttonLink ?? null;

  if (typeof body.featured !== 'undefined') out.featured = !!body.featured;
  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;

  if (typeof body.display_order !== 'undefined') out.display_order = toNum(body.display_order, 0);

  if (typeof body.image_url !== 'undefined') out.image_url = body.image_url ?? null;
  if (typeof body.image_asset_id !== 'undefined') out.image_asset_id = body.image_asset_id ?? null;

  return out;
}

export function toSliderUpdateApiBody(body: SliderUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof body.name !== 'undefined') out.name = body.name ? toTrimStr(body.name) : '';
  if (typeof body.slug !== 'undefined') out.slug = body.slug ? toTrimStr(body.slug) : '';

  if (typeof body.description !== 'undefined') out.description = body.description ?? null;

  if (typeof body.alt !== 'undefined') out.alt = body.alt ?? null;

  if (typeof body.buttonText !== 'undefined') out.buttonText = body.buttonText ?? null;
  if (typeof body.buttonLink !== 'undefined') out.buttonLink = body.buttonLink ?? null;

  if (typeof body.featured !== 'undefined') out.featured = !!body.featured;
  if (typeof body.is_active !== 'undefined') out.is_active = !!body.is_active;

  if (typeof body.display_order !== 'undefined') out.display_order = toNum(body.display_order, 0);

  if (typeof body.image_url !== 'undefined') out.image_url = body.image_url ?? null;
  if (typeof body.image_asset_id !== 'undefined') out.image_asset_id = body.image_asset_id ?? null;

  return out;
}
