// =============================================================
// FILE: src/integrations/types/site_settings.ts
// FINAL — Site Settings types + normalizers + query/body helpers
// - no-explicit-any uyumlu
// - exactOptionalPropertyTypes uyumlu
// - adds SEO/Misc keys (robots/social/schema/hreflang/sitemap/analytics/assets)
// =============================================================

import type { JsonLike, ValueType, QueryParams } from '@/integrations/types';

export type SettingValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

/* -------------------- ADMIN UI: Form model (cards use this) -------------------- */

export type SiteSettings = {
  // ------------------------------------------------------------------
  // SITE IDENTITY (SEO base)
  // ------------------------------------------------------------------
  site_title?: string | null;
  site_description?: string | null;

  // ------------------------------------------------------------------
  // SEO PAGES (from 60.2_site_settings.seo.seed.sql)
  // ------------------------------------------------------------------
  seo_home_title?: string | null;
  seo_home_description?: string | null;

  seo_blog_title?: string | null;
  seo_blog_description?: string | null;

  seo_products_title?: string | null;
  seo_products_description?: string | null;

  seo_categories_title?: string | null;
  seo_categories_description?: string | null;

  seo_contact_title?: string | null;
  seo_contact_description?: string | null;

  seo_about_title?: string | null;
  seo_about_description?: string | null;

  seo_campaigns_title?: string | null;
  seo_campaigns_description?: string | null;

  seo_cart_title?: string | null;
  seo_cart_description?: string | null;

  seo_checkout_title?: string | null;
  seo_checkout_description?: string | null;

  seo_login_title?: string | null;
  seo_login_description?: string | null;

  seo_register_title?: string | null;
  seo_register_description?: string | null;

  seo_faq_title?: string | null;
  seo_faq_description?: string | null;

  seo_terms_title?: string | null;
  seo_terms_description?: string | null;

  seo_privacy_title?: string | null;
  seo_privacy_description?: string | null;

  // ------------------------------------------------------------------
  // ASSETS / BRAND (misc seed)
  // ------------------------------------------------------------------
  favicon_url?: string | null;
  logo_url?: string | null;

  // ------------------------------------------------------------------
  // CUSTOM CODES (misc seed)
  // ------------------------------------------------------------------
  custom_header_code?: string | null;
  custom_footer_code?: string | null;

  // ------------------------------------------------------------------
  // ROBOTS META + ROBOTS.TXT (misc seed)
  // ------------------------------------------------------------------
  robots_meta?: string | null; // e.g. "index,follow" or "noindex,nofollow"
  robots_txt_enabled?: boolean;
  robots_txt_content?: string | null;

  // ------------------------------------------------------------------
  // CANONICAL + HREFLANG (misc seed)
  // ------------------------------------------------------------------
  canonical_base_url?: string | null;
  hreflang_enabled?: boolean;
  hreflang_locales?: string | null; // JSON text (array)

  // ------------------------------------------------------------------
  // SOCIAL (OG + Twitter) (misc seed)
  // ------------------------------------------------------------------
  og_site_name?: string | null;
  og_default_image?: string | null;
  twitter_site?: string | null;
  twitter_card?: string | null; // "summary" | "summary_large_image" etc.

  // ------------------------------------------------------------------
  // VERIFICATION (misc seed)
  // ------------------------------------------------------------------
  google_site_verification?: string | null;
  bing_site_verification?: string | null;

  // ------------------------------------------------------------------
  // SCHEMA.ORG (misc seed)
  // ------------------------------------------------------------------
  schema_org_enabled?: boolean;
  schema_org_organization?: string | null; // JSON text
  schema_org_website?: string | null; // JSON text

  // ------------------------------------------------------------------
  // ANALYTICS (seo kapsaminda yönetilecek)
  // ------------------------------------------------------------------
  analytics_ga_id?: string | null; // e.g. "G-XXXX"
  analytics_gtm_id?: string | null; // e.g. "GTM-XXXX"
  facebook_pixel_id?: string | null;

  // ------------------------------------------------------------------
  // SITEMAP (misc seed)
  // ------------------------------------------------------------------
  sitemap_enabled?: boolean;
  sitemap_base_url?: string | null;
  sitemap_urls?: string | null; // JSON text (array)

  // ------------------------------------------------------------------
  // Payment / Wallet / Bank
  // ------------------------------------------------------------------
  bank_transfer_enabled?: boolean;
  bank_account_info?: string | null;

  payment_methods?: {
    wallet_enabled?: boolean;

    havale_enabled?: boolean;
    havale_iban?: string | null;
    havale_account_holder?: string | null;
    havale_bank_name?: string | null;

    eft_enabled?: boolean;
    eft_iban?: string | null;
    eft_account_holder?: string | null;
    eft_bank_name?: string | null;
  } | null;

  // ------------------------------------------------------------------
  // OAuth / Integrations
  // ------------------------------------------------------------------
  google_client_id?: string | null;
  google_client_secret?: string | null;

  cloudinary_cloud_name?: string | null;
  cloudinary_folder?: string | null;
  cloudinary_api_key?: string | null;
  cloudinary_api_secret?: string | null;
  cloudinary_unsigned_preset?: string | null;

  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  discord_webhook_url?: string | null;

  // ------------------------------------------------------------------
  // SMTP
  // ------------------------------------------------------------------
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_ssl?: boolean;
  smtp_username?: string | null;
  smtp_password?: string | null;
  smtp_from_email?: string | null;
  smtp_from_name?: string | null;

  // ------------------------------------------------------------------
  // Telegram (public read tarafında gerekiyorsa)
  // ------------------------------------------------------------------
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;

  new_order_telegram?: boolean;
  telegram_template_new_order?: string | null;

  telegram_notifications_enabled?: boolean;
  telegram_webhook_enabled?: boolean;
};

/* -------------------- API rows -------------------- */

export type SiteSettingRow = {
  id?: string; // bazı BE'lerde olmayabilir
  key: string;
  value: unknown; // ham değer
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SiteSetting = {
  key: string;
  value: JsonLike;
  updated_at: string | null;
};

export type TopbarSettingRow = {
  id: string;
  is_active: boolean | 0 | 1;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean | 0 | 1;
  created_at?: string | null;
  updated_at?: string | null;
};

/* -------------------- admin request types -------------------- */

export type SiteSettingsAdminListParams = {
  q?: string;
  group?: string;
  keys?: string[];
  prefix?: string;
  limit?: number;
  offset?: number;
  sort?: 'key' | 'updated_at' | 'created_at';
  order?: 'asc' | 'desc';
};

export type UpsertSiteSettingBody = {
  key: string;
  value: SettingValue;
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

export type BulkUpsertSiteSettingBody = { items: UpsertSiteSettingBody[] };

export type DeleteManySiteSettingsParams = {
  idNe?: string;
  key?: string;
  keyNe?: string;
  keys?: string[];
  prefix?: string;
};

/* -------------------- public request types -------------------- */

export type SiteSettingsPublicListParams =
  | {
      prefix?: string;
      keys?: string[];
      order?:
        | 'key.asc'
        | 'key.desc'
        | 'updated_at.asc'
        | 'updated_at.desc'
        | 'created_at.asc'
        | 'created_at.desc';
      limit?: number;
      offset?: number;
    }
  | undefined;

/* -------------------- parsing helpers -------------------- */

const toNum = (x: unknown): number => {
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  const raw = typeof x === 'string' ? x.replace(',', '.') : String(x ?? '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const toBool = (x: unknown): boolean => {
  if (typeof x === 'boolean') return x;
  if (typeof x === 'number') return x !== 0;
  const s = String(x).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on';
};

const tryParseJson = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Admin value normalizer: SiteSettingRow.value + value_type
 */
export function normalizeSettingValue(value: unknown, value_type?: ValueType | null): SettingValue {
  if (value_type === 'boolean') return toBool(value);
  if (value_type === 'number') return value == null ? null : toNum(value);
  if (value_type === 'json') {
    if (typeof value === 'string') {
      const parsed = tryParseJson(value);
      return isObject(parsed) || Array.isArray(parsed) ? (parsed as SettingValue) : null;
    }
    if (isObject(value) || Array.isArray(value)) return value as SettingValue;
    return null;
  }

  // value_type yoksa: best-effort
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return '';
    if (['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(s.toLowerCase()))
      return toBool(s);

    const n = Number(s.replace(',', '.'));
    if (!Number.isNaN(n) && s !== '') return n;

    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      const parsed = tryParseJson(s);
      if (isObject(parsed) || Array.isArray(parsed)) return parsed as SettingValue;
    }
    return s;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value == null) return null;
  if (isObject(value) || Array.isArray(value)) return value as SettingValue;

  return null;
}

/**
 * Public parse: JSON-like normalize (string -> bool/number/json)
 */
export function normalizePublicValue(x: unknown): JsonLike {
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return '';
    if (s === 'true') return true;
    if (s === 'false') return false;

    const n = Number(s.replace(',', '.'));
    if (!Number.isNaN(n) && s !== '') return n;

    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      const parsed = tryParseJson(s);
      return (isObject(parsed) || Array.isArray(parsed) ? (parsed as JsonLike) : s) as JsonLike;
    }
    return s;
  }

  if (typeof x === 'number' || typeof x === 'boolean' || x === null) return x as JsonLike;
  if (isObject(x) || Array.isArray(x)) return x as JsonLike;
  return null;
}

/* -------------------- row normalizers -------------------- */

export type AdminSiteSetting = {
  id: string | null;
  key: string;
  value: SettingValue;
  value_type: ValueType | null;
  group: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function normalizeAdminSiteSetting(row: SiteSettingRow): AdminSiteSetting {
  const id = typeof row.id === 'string' && row.id.trim() ? row.id : null;

  const created_at =
    typeof row.created_at === 'string' && row.created_at.trim() ? row.created_at : null;
  const updated_at =
    typeof row.updated_at === 'string' && row.updated_at.trim() ? row.updated_at : null;

  const value_type = row.value_type ?? null;

  return {
    id,
    key: String(row.key ?? ''),
    value: normalizeSettingValue(row.value, value_type),
    value_type,
    group: row.group ?? null,
    description: row.description ?? null,
    created_at,
    updated_at,
  };
}

export function normalizeAdminSiteSettingList(res: unknown): AdminSiteSetting[] {
  return Array.isArray(res) ? (res as SiteSettingRow[]).map(normalizeAdminSiteSetting) : [];
}

export function normalizePublicSiteSettingList(res: unknown): SiteSetting[] {
  const arr = Array.isArray(res)
    ? (res as Array<{ key: string; value: unknown; updated_at?: string | null }>)
    : [];

  return arr.map((r) => ({
    key: String(r.key ?? ''),
    value: normalizePublicValue(r.value),
    updated_at: typeof r.updated_at === 'string' && r.updated_at.trim() ? r.updated_at : null,
  }));
}

export function normalizePublicSiteSetting(res: unknown): SiteSetting | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as { key?: unknown; value?: unknown; updated_at?: unknown };
  if (typeof r.key !== 'string' || !r.key.trim()) return null;

  return {
    key: r.key,
    value: normalizePublicValue(r.value),
    updated_at: typeof r.updated_at === 'string' && r.updated_at.trim() ? r.updated_at : null,
  };
}

/* -------------------- query builders (typed) -------------------- */

export function toAdminSiteSettingsQuery(p?: SiteSettingsAdminListParams): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.q) q.q = p.q;
  if (p.group) q.group = p.group;
  if (p.keys?.length) q.keys = p.keys.join(',');
  if (p.prefix) q.prefix = p.prefix;

  const col = p.sort ?? 'key';
  const dir = p.order ?? 'asc';
  q.order = `${col}.${dir}`;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  return Object.keys(q).length ? q : undefined;
}

export function toPublicSiteSettingsQuery(
  p?: SiteSettingsPublicListParams,
): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.prefix) q.prefix = p.prefix;
  if (p.keys?.length) q.keys = p.keys.join(',');
  if (p.order) q.order = p.order;
  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  return Object.keys(q).length ? q : undefined;
}

export function toDeleteManySiteSettingsQuery(p: DeleteManySiteSettingsParams): QueryParams {
  const q: QueryParams = {};
  if (p.idNe) q['id!'] = p.idNe;
  if (p.key) q.key = p.key;
  if (p.keyNe) q['key!'] = p.keyNe;
  if (p.keys?.length) q.keys = p.keys.join(',');
  if (p.prefix) q.prefix = p.prefix;
  return q;
}

/* -------------------- body builders -------------------- */

export function toUpsertSiteSettingApiBody(b: UpsertSiteSettingBody): Record<string, unknown> {
  const out: Record<string, unknown> = {
    key: String(b.key ?? ''),
    value: b.value,
  };

  if (typeof b.value_type !== 'undefined') out.value_type = b.value_type;
  if (typeof b.group !== 'undefined') out.group = b.group;
  if (typeof b.description !== 'undefined') out.description = b.description;

  return out;
}

export function toBulkUpsertSiteSettingsApiBody(
  items: UpsertSiteSettingBody[],
): Record<string, unknown> {
  return {
    items: items.map((i) => toUpsertSiteSettingApiBody(i)),
  };
}
