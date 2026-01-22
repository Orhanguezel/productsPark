// ===================================================================
// FILE: src/integrations/types/popups.ts
// FINAL — Popups types + helpers + normalizers + query builders + admin mappers
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu (undefined param set edilmez)
// ===================================================================

/* -------------------- primitives -------------------- */
import type {
  BoolLike,
  QueryParams,
  JsonObject,
} from '@/integrations/types';
import {
  toStr,
  isPlainObject,
  toBool,
  toTrimStr,
  toNum, 
  pickFirst,
  pickOptStr,
  pickStr,
  pickIsoOrNull,
} from '@/integrations/types';

/* -------------------- local guards/helpers -------------------- */


/**
 * unknown -> BoolLike daraltma
 * toBool sadece BoolLike kabul ettiği için pickFirst(unknown) önce buradan geçirilir.
 */
function asBoolLike(x: unknown): BoolLike {
  if (x == null) return x; // null | undefined
  if (typeof x === 'boolean') return x;
  if (x === 0 || x === 1) return x;

  if (typeof x === 'string') {
    const s = x.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false' || s === 'yes' || s === 'no')
      return s as BoolLike;

    if (s === 'on') return 'true';
    if (s === 'off') return 'false';

  }

  return undefined;
}

function tryParseJsonObject(x: unknown): JsonObject | null {
  if (x == null) return null;
  if (isPlainObject(x)) return x;

  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return null;

    // sadece JSON objeleri kabul edelim; array gelirse null dön
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const parsed: unknown = JSON.parse(s);
        return isPlainObject(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
  }

  return null;
}

function extractArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isPlainObject(res)) {
    for (const k of ['data', 'items', 'rows', 'result', 'popups'] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function clamp(n: number, min = 1, max = 200): number {
  return Math.max(min, Math.min(max, n));
}

/* -------------------- domain types (PUBLIC) -------------------- */

export type PopupType = 'modal' | 'drawer' | 'banner' | 'toast';

export type PopupListQuery = {
  q?: string;
  is_active?: BoolLike;
  type?: PopupType;
  locale?: string;
  limit?: number;
  offset?: number;
};

export type ApiCampaignPopup = {
  id?: unknown;
  key?: unknown;
  title?: unknown;
  type?: unknown;
  content_html?: unknown;

  options?: unknown; // string | object | null

  is_active?: unknown;
  start_at?: unknown;
  end_at?: unknown;
  locale?: unknown;

  created_at?: unknown;
  updated_at?: unknown;

  image_url?: unknown;
  image_asset_id?: unknown;
  image_alt?: unknown;

  button_text?: unknown;
  button_link?: unknown;
  buttonText?: unknown;
  buttonLink?: unknown;

  popup_key?: unknown;
};

export type CampaignPopupView = {
  id: string;

  key: string | null;
  title: string | null;

  type: PopupType;

  content_html: string | null;

  options: JsonObject | null;

  is_active: boolean;

  start_at: string | null; // ISO
  end_at: string | null; // ISO
  locale: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  button_text: string | null;
  button_link: string | null;

  created_at?: string;
  updated_at?: string;
};

/* -------------------- domain types (ADMIN) -------------------- */

/**
 * Admin popup model (FE normalized)
 * Not: bazı backendlerde "content_html", bazılarında "content" alanı gelebilir.
 */
export type DisplayFrequency = 'once' | 'daily' | 'weekly' | 'always';

export type DisplayPages = 'all' | 'home' | 'product' | 'category' | 'checkout' | 'custom';

export type PopupAdminView = {
  id: string;

  title: string;
  content: string;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  button_text: string | null;
  button_link: string | null;

  is_active: boolean;

  display_frequency: DisplayFrequency;
  delay_seconds: number;

  start_date: string | null; // ISO date/datetime tolerant
  end_date: string | null;

  product_id: string | null;
  coupon_code: string | null;

  display_pages: DisplayPages;
  priority: number | null;
  duration_seconds: number | null;

  created_at?: string;
  updated_at?: string;
};

export type PopupAdminUpsertBody = {
  title: string;
  content: string;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  button_text?: string | null;
  button_link?: string | null;

  is_active?: BoolLike;

  display_frequency?: DisplayFrequency;
  delay_seconds?: number;

  start_date?: string | null;
  end_date?: string | null;

  product_id?: string | null;
  coupon_code?: string | null;

  display_pages?: DisplayPages;
  priority?: number | null;
  duration_seconds?: number | null;
};

export type PopupAdminPatchBody = Partial<PopupAdminUpsertBody>;

/* -------------------- normalizers (PUBLIC) -------------------- */

function normPopupType(x: unknown): PopupType {
  const s = toStr(x).trim().toLowerCase();
  if (s === 'drawer' || s === 'banner' || s === 'toast' || s === 'modal') return s as PopupType;
  return 'modal';
}

export function normalizeCampaignPopup(row: unknown): CampaignPopupView {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const key = pickOptStr(r, ['key', 'popup_key', 'popupKey', 'campaign_key']);
  const title = pickOptStr(r, ['title', 'name']);

  const options = tryParseJsonObject(pickFirst(r, ['options'])) ?? null;

  const createdAt = pickOptStr(r, ['created_at', 'createdAt']) ?? undefined;
  const updatedAt = pickOptStr(r, ['updated_at', 'updatedAt']) ?? undefined;

  const button_text = pickOptStr(r, ['button_text', 'buttonText', 'cta_text', 'ctaText']) ?? null;
  const button_link = pickOptStr(r, ['button_link', 'buttonLink', 'cta_link', 'ctaLink']) ?? null;

  const activeLike = asBoolLike(pickFirst(r, ['is_active', 'active', 'enabled']));

  return {
    id: pickStr(r, ['id'], ''),

    key,
    title,

    type: normPopupType(pickFirst(r, ['type'])),
    content_html: pickOptStr(r, ['content_html', 'content', 'html']) ?? null,

    options,

    is_active: toBool(activeLike, true),

    start_at: pickIsoOrNull(r, ['start_at', 'startAt', 'starts_at']),
    end_at: pickIsoOrNull(r, ['end_at', 'endAt', 'ends_at']),
    locale: pickOptStr(r, ['locale', 'lang']) ?? null,

    image_url: pickOptStr(r, ['image_url', 'imageUrl']) ?? null,
    image_asset_id: pickOptStr(r, ['image_asset_id', 'imageAssetId', 'asset_id']) ?? null,
    image_alt: pickOptStr(r, ['image_alt', 'imageAlt', 'alt']) ?? null,

    button_text,
    button_link,

    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

export function normalizeCampaignPopupList(res: unknown): CampaignPopupView[] {
  return extractArray(res).map((x) => normalizeCampaignPopup(x));
}

/* -------------------- normalizers (ADMIN) -------------------- */

function normDisplayFrequency(x: unknown): DisplayFrequency {
  const s = toStr(x).trim().toLowerCase();
  if (s === 'once' || s === 'daily' || s === 'weekly' || s === 'always') return s as DisplayFrequency;
  return 'once';
}

function normDisplayPages(x: unknown): DisplayPages {
  const s = toStr(x).trim().toLowerCase();
  if (s === 'all' || s === 'home' || s === 'product' || s === 'category' || s === 'checkout' || s === 'custom')
    return s as DisplayPages;
  return 'all';
}

/**
 * Admin API row tolerant normalize
 * Backend alanları:
 * - content | content_html | html
 * - image_url|imageUrl, etc.
 * - display_frequency, display_pages
 */
export function normalizePopupAdminView(row: unknown): PopupAdminView {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const createdAt = pickOptStr(r, ['created_at', 'createdAt']) ?? undefined;
  const updatedAt = pickOptStr(r, ['updated_at', 'updatedAt']) ?? undefined;

  const activeLike = asBoolLike(pickFirst(r, ['is_active', 'active', 'enabled']));

  const title = pickStr(r, ['title', 'name'], '');
  const content = pickStr(r, ['content', 'content_html', 'html'], '');

  const image_url = pickOptStr(r, ['image_url', 'imageUrl']) ?? null;
  const image_asset_id = pickOptStr(r, ['image_asset_id', 'imageAssetId', 'asset_id']) ?? null;
  const image_alt = pickOptStr(r, ['image_alt', 'imageAlt', 'alt']) ?? null;

  const button_text = pickOptStr(r, ['button_text', 'buttonText', 'cta_text', 'ctaText']) ?? null;
  const button_link = pickOptStr(r, ['button_link', 'buttonLink', 'cta_link', 'ctaLink']) ?? null;

  const display_frequency = normDisplayFrequency(pickFirst(r, ['display_frequency', 'displayFrequency']));
  const delay_seconds = Math.max(0, Math.trunc(toNum(pickFirst(r, ['delay_seconds', 'delaySeconds']), 0)));

  const start_date = pickIsoOrNull(r, ['start_date', 'startDate', 'starts_at', 'start_at']);
  const end_date = pickIsoOrNull(r, ['end_date', 'endDate', 'ends_at', 'end_at']);

  const product_id = pickOptStr(r, ['product_id', 'productId']) ?? null;
  const coupon_code = pickOptStr(r, ['coupon_code', 'couponCode']) ?? null;

  const display_pages = normDisplayPages(pickFirst(r, ['display_pages', 'displayPages']));
  const priorityRaw = pickFirst(r, ['priority']);
  const priority =
    priorityRaw == null ? null : Number.isFinite(Number(priorityRaw)) ? Number(priorityRaw) : null;

  const durationRaw = pickFirst(r, ['duration_seconds', 'durationSeconds']);
  const duration_seconds =
    durationRaw == null ? null : Number.isFinite(Number(durationRaw)) ? Number(durationRaw) : null;

  return {
    id: pickStr(r, ['id'], ''),

    title,
    content,

    image_url,
    image_asset_id,
    image_alt,

    button_text,
    button_link,

    is_active: toBool(activeLike, false),

    display_frequency,
    delay_seconds,

    start_date,
    end_date,

    product_id,
    coupon_code,

    display_pages,
    priority,
    duration_seconds,

    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

export function normalizePopupAdminList(res: unknown): PopupAdminView[] {
  return extractArray(res).map((x) => normalizePopupAdminView(x));
}

/* -------------------- query builders (PUBLIC) -------------------- */

export function toPopupListQueryParams(p?: PopupListQuery | void): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};

  if (p.q) out.q = p.q;
  if (typeof p.is_active !== 'undefined') out.is_active = toBool(p.is_active) ? '1' : '0';
  if (p.type) out.type = p.type;
  if (p.locale) out.locale = p.locale;

  if (typeof p.limit === 'number') out.limit = clamp(toNum(p.limit, 20), 1, 200);
  if (typeof p.offset === 'number') out.offset = Math.max(0, Math.trunc(toNum(p.offset, 0)));

  return Object.keys(out).length ? out : undefined;
}

/* -------------------- body mappers (ADMIN) -------------------- */

/**
 * Admin create/update body -> API
 * - undefined alanları set etme (exactOptionalPropertyTypes friendly)
 * - BoolLike alanlar: backend genelde boolean bekler => normalize boolean gönder
 */
export function toPopupAdminApiBody(b: PopupAdminUpsertBody | PopupAdminPatchBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof b.title !== 'undefined') out.title = toTrimStr(b.title);
  if (typeof b.content !== 'undefined') out.content = b.content ?? '';

  if (typeof b.image_url !== 'undefined') out.image_url = b.image_url;
  if (typeof b.image_asset_id !== 'undefined') out.image_asset_id = b.image_asset_id;
  if (typeof b.image_alt !== 'undefined') out.image_alt = b.image_alt;

  if (typeof b.button_text !== 'undefined') out.button_text = b.button_text;
  if (typeof b.button_link !== 'undefined') out.button_link = b.button_link;

  if (typeof b.is_active !== 'undefined') out.is_active = toBool(asBoolLike(b.is_active), false);

  if (typeof b.display_frequency !== 'undefined' && b.display_frequency)
    out.display_frequency = b.display_frequency;

  if (typeof b.delay_seconds !== 'undefined') out.delay_seconds = Math.max(0, Math.trunc(toNum(b.delay_seconds, 0)));

  if (typeof b.start_date !== 'undefined') out.start_date = b.start_date;
  if (typeof b.end_date !== 'undefined') out.end_date = b.end_date;

  if (typeof b.product_id !== 'undefined') out.product_id = b.product_id;
  if (typeof b.coupon_code !== 'undefined') out.coupon_code = b.coupon_code;

  if (typeof b.display_pages !== 'undefined' && b.display_pages) out.display_pages = b.display_pages;

  if (typeof b.priority !== 'undefined') out.priority = b.priority;
  if (typeof b.duration_seconds !== 'undefined') out.duration_seconds = b.duration_seconds;

  return out;
}
