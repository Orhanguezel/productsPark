// =============================================================
// FILE: src/modules/seo/spa.ts
// SPA Meta Tag Injection Middleware
// - Reads dist/index.html, injects route-aware meta tags
// - Serves modified HTML for all non-API page requests
// =============================================================

import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import { products } from '@/modules/products/schema';
import { categories } from '@/modules/categories/schema';
import { blogPosts } from '@/modules/blog/schema';
import { customPages } from '@/modules/customPages/schema';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SeoMeta = {
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogSiteName?: string;
  twitterCard?: string;
  jsonLd?: Record<string, unknown> | null;
};

type GlobalSeoCache = {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  ogDefaultImage: string;
  robotsMeta: string;
  canonicalBaseUrl: string;
  twitterCard: string;
  twitterSite: string;
  /** page-specific SEO from site_settings */
  pageSeo: Record<string, string>;
  fetchedAt: number;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const PLACEHOLDER = '<!--__SEO_META__-->';
const CACHE_TTL_MS = 60_000; // 60 seconds

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function parseDbValue(s: unknown): string {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (!t) return '';
  try {
    const parsed = JSON.parse(t);
    return typeof parsed === 'string' ? parsed : t;
  } catch {
    return t;
  }
}

function nonEmpty(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  return s || '';
}

/** Ensure Cloudinary image meets OG minimum (1200x630). Non-Cloudinary URLs pass through. */
function ogImageUrl(url: string): string {
  if (!url) return '';
  // Match Cloudinary upload URLs and inject transform if missing
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/);
  if (match) {
    // Already has a transform (e.g. c_fill)? leave it alone
    if (/\/[a-z]_[^/]+\/v\d+\//.test(url)) return url;
    return `${match[1]}c_fill,w_1200,h_630,g_center/${match[2]}`;
  }
  return url;
}

/** Build meta tag HTML string from SeoMeta */
function buildMetaHtml(meta: SeoMeta): string {
  const lines: string[] = [];

  if (meta.title) {
    lines.push(`<title>${esc(meta.title)}</title>`);
    lines.push(`<meta name="title" content="${esc(meta.title)}" />`);
  }
  if (meta.description) {
    lines.push(`<meta name="description" content="${esc(meta.description)}" />`);
  }
  if (meta.robots) {
    lines.push(`<meta name="robots" content="${esc(meta.robots)}" />`);
  }
  if (meta.canonical) {
    lines.push(`<link rel="canonical" href="${esc(meta.canonical)}" />`);
  }

  // OpenGraph
  if (meta.ogType) {
    lines.push(`<meta property="og:type" content="${esc(meta.ogType)}" />`);
  }
  if (meta.ogTitle || meta.title) {
    lines.push(`<meta property="og:title" content="${esc(meta.ogTitle || meta.title || '')}" />`);
  }
  if (meta.ogDescription || meta.description) {
    lines.push(
      `<meta property="og:description" content="${esc(meta.ogDescription || meta.description || '')}" />`,
    );
  }
  if (meta.ogImage) {
    const ogImg = ogImageUrl(meta.ogImage);
    lines.push(`<meta property="og:image" content="${esc(ogImg)}" />`);
  }
  if (meta.ogUrl) {
    lines.push(`<meta property="og:url" content="${esc(meta.ogUrl)}" />`);
  }
  if (meta.ogSiteName) {
    lines.push(`<meta property="og:site_name" content="${esc(meta.ogSiteName)}" />`);
  }

  // Twitter
  if (meta.twitterCard) {
    lines.push(`<meta name="twitter:card" content="${esc(meta.twitterCard)}" />`);
  }
  if (meta.ogTitle || meta.title) {
    lines.push(
      `<meta name="twitter:title" content="${esc(meta.ogTitle || meta.title || '')}" />`,
    );
  }
  if (meta.ogDescription || meta.description) {
    lines.push(
      `<meta name="twitter:description" content="${esc(meta.ogDescription || meta.description || '')}" />`,
    );
  }
  if (meta.ogImage) {
    const twImg = ogImageUrl(meta.ogImage);
    lines.push(`<meta name="twitter:image" content="${esc(twImg)}" />`);
  }

  // JSON-LD
  if (meta.jsonLd) {
    try {
      lines.push(
        `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
      );
    } catch { /* ignore */ }
  }

  return lines.join('\n    ');
}

/* ------------------------------------------------------------------ */
/* Global SEO cache                                                    */
/* ------------------------------------------------------------------ */

const GLOBAL_SEO_KEYS = [
  'site_title',
  'site_description',
  'og_site_name',
  'og_default_image',
  'robots_meta',
  'canonical_base_url',
  'twitter_card',
  'twitter_site',
  // logo fallback for og:image
  'logo_url',
  'light_logo',
  // page-specific SEO
  'seo_home_title',
  'seo_home_description',
  'seo_products_title',
  'seo_products_description',
  'seo_categories_title',
  'seo_categories_description',
  'seo_blog_title',
  'seo_blog_description',
  'seo_contact_title',
  'seo_contact_description',
  'seo_about_title',
  'seo_about_description',
  'seo_campaigns_title',
  'seo_campaigns_description',
];

let globalCache: GlobalSeoCache | null = null;

async function getGlobalSeo(): Promise<GlobalSeoCache> {
  if (globalCache && Date.now() - globalCache.fetchedAt < CACHE_TTL_MS) {
    return globalCache;
  }

  const rows = await db
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings)
    .where(inArray(siteSettings.key, GLOBAL_SEO_KEYS));

  const bag: Record<string, string> = {};
  for (const r of rows) {
    bag[r.key] = parseDbValue(r.value);
  }

  globalCache = {
    siteName: nonEmpty(bag.og_site_name) || nonEmpty(bag.site_title),
    siteTitle: nonEmpty(bag.site_title),
    siteDescription: nonEmpty(bag.site_description),
    ogDefaultImage: nonEmpty(bag.og_default_image) || nonEmpty(bag.logo_url) || nonEmpty(bag.light_logo),
    robotsMeta: nonEmpty(bag.robots_meta) || 'index,follow',
    canonicalBaseUrl: nonEmpty(bag.canonical_base_url),
    twitterCard: nonEmpty(bag.twitter_card) || 'summary_large_image',
    twitterSite: nonEmpty(bag.twitter_site),
    pageSeo: bag,
    fetchedAt: Date.now(),
  };

  return globalCache;
}

/* ------------------------------------------------------------------ */
/* Route resolvers                                                     */
/* ------------------------------------------------------------------ */

/** Build canonical URL from base + path */
function canonical(base: string, urlPath: string): string {
  if (!base) return '';
  const b = base.replace(/\/+$/, '');
  const p = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${b}${p}`;
}

/** Strip HTML tags from string */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

/** Truncate text to max length */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

// --- Static page resolvers ---

async function resolveStaticPage(
  urlPath: string,
  g: GlobalSeoCache,
): Promise<SeoMeta | null> {
  const map: Record<string, { titleKey: string; descKey: string; ogType?: string }> = {
    '/': { titleKey: 'seo_home_title', descKey: 'seo_home_description' },
    '/urunler': { titleKey: 'seo_products_title', descKey: 'seo_products_description' },
    '/kategoriler': { titleKey: 'seo_categories_title', descKey: 'seo_categories_description' },
    '/blog': { titleKey: 'seo_blog_title', descKey: 'seo_blog_description' },
    '/iletisim': { titleKey: 'seo_contact_title', descKey: 'seo_contact_description' },
    '/hakkimizda': { titleKey: 'seo_about_title', descKey: 'seo_about_description' },
    '/kampanyalar': { titleKey: 'seo_campaigns_title', descKey: 'seo_campaigns_description' },
  };

  const entry = map[urlPath];
  if (!entry) return null;

  const title = nonEmpty(g.pageSeo[entry.titleKey]) || g.siteTitle;
  const description = nonEmpty(g.pageSeo[entry.descKey]) || g.siteDescription;

  return {
    title,
    description,
    robots: g.robotsMeta,
    canonical: canonical(g.canonicalBaseUrl, urlPath),
    ogType: 'website',
    ogImage: g.ogDefaultImage || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
  };
}

// --- noindex pages ---

const NOINDEX_PREFIXES = [
  '/sepet',
  '/odeme',
  '/giris',
  '/sifre-sifirlama',
  '/hesabim',
  '/siparis/',
  '/destek',
  '/coupon',
  '/dokumantasyon',
];

function isNoindexPage(urlPath: string): boolean {
  return NOINDEX_PREFIXES.some((p) => urlPath === p || urlPath.startsWith(p + '/') || urlPath.startsWith(p + '?'));
}

function resolveNoindexPage(urlPath: string, g: GlobalSeoCache): SeoMeta {
  // Simple title mapping
  const titles: Record<string, string> = {
    '/sepet': 'Sepet',
    '/odeme': 'Ödeme',
    '/giris': 'Giriş Yap | Kayıt Ol',
    '/sifre-sifirlama': 'Şifremi Unuttum',
    '/hesabim': 'Hesabım',
    '/destek': 'Destek',
  };

  const prefix = Object.keys(titles).find((p) => urlPath === p || urlPath.startsWith(p + '/'));
  const title = prefix ? titles[prefix] : g.siteTitle;

  return {
    title: g.siteName ? `${title} - ${g.siteName}` : title,
    robots: 'noindex,nofollow',
    ogSiteName: g.siteName,
  };
}

// --- Product detail resolver ---

async function resolveProduct(slug: string, g: GlobalSeoCache): Promise<SeoMeta | null> {
  const rows = await db
    .select({
      name: products.name,
      slug: products.slug,
      meta_title: products.meta_title,
      meta_description: products.meta_description,
      short_description: products.short_description,
      description: products.description,
      featured_image: products.featured_image,
      featured_image_alt: products.featured_image_alt,
      price: products.price,
      stock_quantity: products.stock_quantity,
      category_name: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(and(eq(products.slug, slug), eq(products.is_active, 1)))
    .limit(1);

  const p = rows[0];
  if (!p) return null;

  const title = nonEmpty(p.meta_title) || p.name;
  const fullTitle = g.siteName ? `${title} - ${g.siteName}` : title;

  const descRaw =
    nonEmpty(p.meta_description) ||
    nonEmpty(p.short_description) ||
    (p.description ? truncate(stripHtml(p.description), 160) : '');

  const image = nonEmpty(p.featured_image) || g.ogDefaultImage;
  const urlPath = `/urun/${p.slug}`;
  const price = p.price != null ? String(p.price) : undefined;

  // Product JSON-LD
  const availability =
    typeof p.stock_quantity === 'number'
      ? p.stock_quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
      : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    ...(descRaw ? { description: descRaw } : {}),
    ...(image ? { image: [image] } : {}),
    ...(g.siteName ? { brand: { '@type': 'Brand', name: g.siteName } } : {}),
    offers: {
      '@type': 'Offer',
      url: canonical(g.canonicalBaseUrl, urlPath),
      priceCurrency: 'TRY',
      ...(price ? { price } : {}),
      ...(availability ? { availability } : {}),
    },
  };

  return {
    title: fullTitle,
    description: descRaw,
    robots: g.robotsMeta,
    canonical: canonical(g.canonicalBaseUrl, urlPath),
    ogType: 'product',
    ogImage: image || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
    jsonLd,
  };
}

// --- Category page resolver ---

async function resolveCategory(slug: string, g: GlobalSeoCache): Promise<SeoMeta | null> {
  const rows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      seo_title: categories.seo_title,
      seo_description: categories.seo_description,
      description: categories.description,
      image_url: categories.image_url,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  const c = rows[0];
  if (!c) return null;

  const title = nonEmpty(c.seo_title) || c.name;
  const fullTitle = g.siteName ? `${title} - ${g.siteName}` : title;
  const description =
    nonEmpty(c.seo_description) ||
    (c.description ? truncate(stripHtml(c.description), 160) : '');
  const image = nonEmpty(c.image_url) || g.ogDefaultImage;

  return {
    title: fullTitle,
    description,
    robots: g.robotsMeta,
    canonical: canonical(g.canonicalBaseUrl, `/kategoriler/${c.slug}`),
    ogType: 'website',
    ogImage: image || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
  };
}

// --- Blog detail resolver ---

async function resolveBlogPost(slug: string, g: GlobalSeoCache): Promise<SeoMeta | null> {
  const rows = await db
    .select({
      title: blogPosts.title,
      slug: blogPosts.slug,
      meta_title: blogPosts.meta_title,
      meta_description: blogPosts.meta_description,
      excerpt: blogPosts.excerpt,
      featured_image: blogPosts.featured_image,
      author: blogPosts.author,
      published_at: blogPosts.published_at,
      updated_at: blogPosts.updated_at,
      category: blogPosts.category,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.is_published, 1)))
    .limit(1);

  const b = rows[0];
  if (!b) return null;

  const title = nonEmpty(b.meta_title) || b.title;
  const fullTitle = g.siteName ? `${title} - ${g.siteName}` : title;
  const description =
    nonEmpty(b.meta_description) || nonEmpty(b.excerpt) || '';
  const image = nonEmpty(b.featured_image) || g.ogDefaultImage;
  const urlPath = `/blog/${b.slug}`;

  // BlogPosting JSON-LD
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: b.title,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    url: canonical(g.canonicalBaseUrl, urlPath),
    ...(b.published_at ? { datePublished: new Date(b.published_at).toISOString() } : {}),
    ...(b.updated_at ? { dateModified: new Date(b.updated_at).toISOString() } : {}),
    ...(b.author ? { author: { '@type': 'Person', name: b.author } } : {}),
    ...(b.category ? { articleSection: b.category } : {}),
    ...(g.siteName
      ? { publisher: { '@type': 'Organization', name: g.siteName } }
      : {}),
  };

  return {
    title: fullTitle,
    description,
    robots: g.robotsMeta,
    canonical: canonical(g.canonicalBaseUrl, urlPath),
    ogType: 'article',
    ogImage: image || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
    jsonLd,
  };
}

// --- Custom page resolver ---

async function resolveCustomPage(slug: string, g: GlobalSeoCache): Promise<SeoMeta | null> {
  const rows = await db
    .select({
      title: customPages.title,
      slug: customPages.slug,
      meta_title: customPages.meta_title,
      meta_description: customPages.meta_description,
      featured_image: customPages.featured_image,
    })
    .from(customPages)
    .where(and(eq(customPages.slug, slug), eq(customPages.is_published, 1)))
    .limit(1);

  const p = rows[0];
  if (!p) return null;

  const title = nonEmpty(p.meta_title) || p.title;
  const fullTitle = g.siteName ? `${title} - ${g.siteName}` : title;
  const description = nonEmpty(p.meta_description) || '';
  const image = nonEmpty(p.featured_image) || g.ogDefaultImage;

  return {
    title: fullTitle,
    description,
    robots: g.robotsMeta,
    canonical: canonical(g.canonicalBaseUrl, `/${p.slug}`),
    ogType: 'website',
    ogImage: image || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
  };
}

/* ------------------------------------------------------------------ */
/* Main route resolver                                                 */
/* ------------------------------------------------------------------ */

async function resolveMeta(urlPath: string): Promise<SeoMeta> {
  const g = await getGlobalSeo();

  // Clean path: remove query string and trailing slash
  const clean = urlPath.split('?')[0].replace(/\/+$/, '') || '/';

  // 1. noindex pages
  if (isNoindexPage(clean)) {
    return resolveNoindexPage(clean, g);
  }

  // 2. Static pages (/, /urunler, /blog, etc.)
  const staticMeta = await resolveStaticPage(clean, g);
  if (staticMeta) return staticMeta;

  // 3. Dynamic pages
  const segments = clean.split('/').filter(Boolean);

  // /urun/:slug
  if (segments[0] === 'urun' && segments[1]) {
    const meta = await resolveProduct(segments[1], g);
    if (meta) return meta;
  }

  // /kategoriler/:slug
  if (segments[0] === 'kategoriler' && segments[1]) {
    const meta = await resolveCategory(segments[1], g);
    if (meta) return meta;
  }

  // /blog/:slug
  if (segments[0] === 'blog' && segments[1]) {
    const meta = await resolveBlogPost(segments[1], g);
    if (meta) return meta;
  }

  // /:slug (custom pages — last resort)
  if (segments.length === 1) {
    const meta = await resolveCustomPage(segments[0], g);
    if (meta) return meta;
  }

  // Fallback: site defaults
  return {
    title: g.siteTitle,
    description: g.siteDescription,
    robots: g.robotsMeta,
    ogType: 'website',
    ogImage: g.ogDefaultImage || undefined,
    ogSiteName: g.siteName,
    twitterCard: g.twitterCard,
  };
}

/* ------------------------------------------------------------------ */
/* SPA handler (exported for use in 404 handler)                       */
/* ------------------------------------------------------------------ */

let htmlTemplate = '';

export function initSpaTemplate(distPath: string): void {
  const indexPath = path.join(distPath, 'index.html');
  htmlTemplate = fs.readFileSync(indexPath, 'utf-8');
}

export async function handleSpaRequest(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!htmlTemplate) {
    reply.code(500).send('SPA template not loaded');
    return;
  }

  try {
    const meta = await resolveMeta(req.url);
    const metaHtml = buildMetaHtml(meta);
    const html = htmlTemplate.replace(PLACEHOLDER, metaHtml);

    reply
      .code(200)
      .header('content-type', 'text/html; charset=utf-8')
      .header('cache-control', 'no-cache')
      .send(html);
  } catch (err) {
    // Graceful degradation: serve unmodified template
    req.log?.warn?.(err, 'SPA meta injection failed, serving fallback');
    reply
      .code(200)
      .header('content-type', 'text/html; charset=utf-8')
      .send(htmlTemplate);
  }
}

/* ------------------------------------------------------------------ */
/* Fastify plugin                                                      */
/* ------------------------------------------------------------------ */

export async function registerSpaMiddleware(
  app: FastifyInstance,
  opts: { distPath: string },
): Promise<void> {
  initSpaTemplate(opts.distPath);
  app.log.info(`SPA meta injection enabled (dist: ${opts.distPath})`);
}
