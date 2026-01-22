// =============================================================
// FILE: src/modules/seo/controller.ts
// FINAL — SEO Public Controllers (robots.txt + sitemap.xml)
// - Reads from site_settings table
// - safe parsing + sensible fallbacks
// =============================================================

import type { RouteHandler } from 'fastify';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';

type SettingRow = { key: string; value: unknown };

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return false;
};

async function getSetting(key: string): Promise<SettingRow | null> {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  const r = rows[0] as unknown as { key?: unknown; value?: unknown } | undefined;
  if (!r?.key) return null;
  return { key: String(r.key), value: r.value };
}

const escapeXml = (s: string): string =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

type SitemapUrlItem = {
  path: string;
  changefreq?: string;
  priority?: number;
  lastmod?: string;
};

function parseSitemapUrls(raw: unknown): SitemapUrlItem[] {
  const s = toStr(raw).trim();
  if (!s) return [];

  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return [];

    const out: SitemapUrlItem[] = [];

    for (const it of arr) {
      if (!it || typeof it !== 'object' || Array.isArray(it)) continue;
      const o = it as Record<string, unknown>;

      const path = typeof o.path === 'string' ? o.path.trim() : '';
      if (!path) continue;

      const item: SitemapUrlItem = { path };

      const cf = typeof o.changefreq === 'string' ? o.changefreq.trim() : '';
      if (cf) item.changefreq = cf;

      const pr =
        typeof o.priority === 'number'
          ? o.priority
          : typeof o.priority === 'string'
          ? Number(o.priority)
          : NaN;
      if (Number.isFinite(pr)) item.priority = pr;

      const lm = typeof o.lastmod === 'string' ? o.lastmod.trim() : '';
      if (lm) item.lastmod = lm;

      out.push(item);
    }

    return out;
  } catch {
    return [];
  }
}

function joinUrl(base: string, path: string): string {
  const b = (base || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function buildSitemapXml(baseUrl: string, items: SitemapUrlItem[]): string {
  const nowIso = new Date().toISOString();

  const body = items
    .map((it) => {
      const loc = escapeXml(joinUrl(baseUrl, it.path));
      const lastmod = `<lastmod>${escapeXml(it.lastmod || nowIso)}</lastmod>`;
      const changefreq = it.changefreq
        ? `<changefreq>${escapeXml(it.changefreq)}</changefreq>`
        : '';
      const priority =
        typeof it.priority === 'number' && Number.isFinite(it.priority)
          ? `<priority>${it.priority.toFixed(1)}</priority>`
          : '';
      return `<url><loc>${loc}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    body +
    `</urlset>`
  );
}

/* ------------------------------------------------------------------ */
/* Controllers */
/* ------------------------------------------------------------------ */

export const robotsTxtController: RouteHandler = async (req, reply) => {
  const enabled = toBool((await getSetting('robots_txt_enabled'))?.value);

  reply.type('text/plain; charset=utf-8');

  // disabled => minimal default
  if (!enabled) {
    return reply.send('User-agent: *\nDisallow:\n');
  }

  const content = toStr((await getSetting('robots_txt_content'))?.value).trim();

  // empty content => default with sitemap
  if (!content) {
    const host = `${req.protocol}://${req.hostname}`;
    return reply.send(`User-agent: *\nDisallow:\n\nSitemap: ${host}/sitemap.xml\n`);
  }

  return reply.send(content.endsWith('\n') ? content : `${content}\n`);
};

export const sitemapXmlController: RouteHandler = async (req, reply) => {
  const enabled = toBool((await getSetting('sitemap_enabled'))?.value);
  if (!enabled) return reply.code(404).send('Not found');

  const baseUrlRaw = toStr((await getSetting('sitemap_base_url'))?.value).trim();
  const baseUrl = baseUrlRaw || `${req.protocol}://${req.hostname}`;

  const urlsRaw = (await getSetting('sitemap_urls'))?.value;
  const items = parseSitemapUrls(urlsRaw);

  const xml = buildSitemapXml(baseUrl, items);
  reply.type('application/xml; charset=utf-8');
  return reply.send(xml);
};


type SeoMetaResponse = {
  robots_meta: string;

  favicon_url: string;
  logo_url: string;

  og_site_name: string;
  og_default_image: string;
  twitter_site: string;
  twitter_card: string;

  google_site_verification: string;
  bing_site_verification: string;

  schema_org_enabled: boolean;
  schema_org_organization: string;
  schema_org_website: string;

  analytics_ga_id: string;
  analytics_gtm_id: string;
  facebook_pixel_id: string;

  // custom codes
  custom_header_code: string;
  custom_footer_code: string;

  updated_at: string | null;
};

const SEO_META_KEYS = [
  'robots_meta',

  'favicon_url',
  'logo_url',

  'og_site_name',
  'og_default_image',
  'twitter_site',
  'twitter_card',

  'google_site_verification',
  'bing_site_verification',

  'schema_org_enabled',
  'schema_org_organization',
  'schema_org_website',

  'analytics_ga_id',
  'analytics_gtm_id',
  'facebook_pixel_id',

  // ✅ canonical + hreflang
  'canonical_base_url',
  'hreflang_enabled',
  'hreflang_locales',

  // ✅ custom codes
  'custom_header_code',
  'custom_footer_code',
] as const;

const toBoolStrict = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  }
  return false;
};

export const seoMetaController: RouteHandler = async (_req, reply) => {
  // tek query ile al
  const rows = await db
    .select({
      key: siteSettings.key,
      value: siteSettings.value,
      updated_at: siteSettings.updated_at,
    })
    .from(siteSettings)
    .where(inArray(siteSettings.key, SEO_META_KEYS as unknown as string[]));

  // bag: key->value
  const bag: Record<string, unknown> = {};
  let lastUpdated: string | null = null;

  for (const r of rows as Array<{ key: string; value: unknown; updated_at: unknown }>) {
    const k = String(r.key ?? '');
    bag[k] = r.value;
    const u = typeof r.updated_at === 'string' && r.updated_at.trim() ? r.updated_at : null;
    // en yeni updated_at seçmek istiyorsan karşılaştırabilirsin; basitçe ilk doluyu alıyoruz
    if (!lastUpdated && u) lastUpdated = u;
  }

  // response type’e ekle
  type SeoMetaResponse = {
    robots_meta: string;

    favicon_url: string;
    logo_url: string;

    og_site_name: string;
    og_default_image: string;
    twitter_site: string;
    twitter_card: string;

    google_site_verification: string;
    bing_site_verification: string;

    schema_org_enabled: boolean;
    schema_org_organization: string;
    schema_org_website: string;

    analytics_ga_id: string;
    analytics_gtm_id: string;
    facebook_pixel_id: string;

    // ✅ canonical + hreflang
    canonical_base_url: string;
    hreflang_enabled: boolean;
    hreflang_locales: string;

    custom_header_code: string;
    custom_footer_code: string;

    updated_at: string | null;
  };

  const res: SeoMetaResponse = {
    robots_meta: toStr(bag.robots_meta).trim() || 'index,follow',

    favicon_url: toStr(bag.favicon_url).trim(),
    logo_url: toStr(bag.logo_url).trim(),

    og_site_name: toStr(bag.og_site_name).trim(),
    og_default_image: toStr(bag.og_default_image).trim(),
    twitter_site: toStr(bag.twitter_site).trim(),
    twitter_card: toStr(bag.twitter_card).trim() || 'summary_large_image',

    google_site_verification: toStr(bag.google_site_verification).trim(),
    bing_site_verification: toStr(bag.bing_site_verification).trim(),

    schema_org_enabled: toBoolStrict(bag.schema_org_enabled),
    schema_org_organization: toStr(bag.schema_org_organization),
    schema_org_website: toStr(bag.schema_org_website),

    analytics_ga_id: toStr(bag.analytics_ga_id).trim(),
    analytics_gtm_id: toStr(bag.analytics_gtm_id).trim(),
    facebook_pixel_id: toStr(bag.facebook_pixel_id).trim(),

    // ✅ canonical + hreflang
    canonical_base_url: toStr(bag.canonical_base_url).trim(),
    hreflang_enabled: toBoolStrict(bag.hreflang_enabled),
    hreflang_locales: toStr(bag.hreflang_locales),

    custom_header_code: toStr(bag.custom_header_code),
    custom_footer_code: toStr(bag.custom_footer_code),

    updated_at: lastUpdated,
  };

  reply.header('cache-control', 'public, max-age=60');
  return reply.send(res);
};

