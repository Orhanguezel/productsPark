// =============================================================
// FILE: src/components/seo/jsonld.ts
// FINAL — JSON-LD builders for SEO schema.org structured data
// - no static schema fallbacks; only emit when caller has data
// =============================================================

import { nonEmpty, getOrigin, imgSrc } from '@/integrations/types';
import type { SiteSettings, Product, ProductReview, ProductFaq } from '@/integrations/types';
import { stripHtmlToText, truncateText } from '@/integrations/types';

export type JsonLd = Record<string, unknown>;

function safeJsonParse<T>(raw: unknown): T | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function setIfMissing(obj: JsonLd, key: string, value: unknown) {
  const cur = obj[key];
  if (typeof cur === 'undefined' || cur == null || cur === '') obj[key] = value;
}

export function buildSiteJsonLd(settings?: SiteSettings | null): {
  organization?: JsonLd;
  website?: JsonLd;
} {
  const enabled = !!settings?.schema_org_enabled;
  if (!enabled) return {};

  const origin = nonEmpty(settings?.canonical_base_url) || getOrigin();
  if (!origin) return {};

  // DB’de schema json yoksa — fallback üretmiyoruz
  const organizationRaw = safeJsonParse<JsonLd>(settings?.schema_org_organization);
  const websiteRaw = safeJsonParse<JsonLd>(settings?.schema_org_website);

  const organization = organizationRaw ? { ...organizationRaw } : null;
  const website = websiteRaw ? { ...websiteRaw } : null;

  const name = nonEmpty(settings?.og_site_name) || nonEmpty(settings?.site_title) || '';
  const logoUrl = nonEmpty(settings?.logo_url);

  if (organization) {
    setIfMissing(organization, '@context', 'https://schema.org');
    setIfMissing(organization, '@type', 'Organization');
    if (name) setIfMissing(organization, 'name', name);
    setIfMissing(organization, 'url', origin);
    if (logoUrl) setIfMissing(organization, 'logo', logoUrl);
  }

  if (website) {
    setIfMissing(website, '@context', 'https://schema.org');
    setIfMissing(website, '@type', 'WebSite');
    if (name) setIfMissing(website, 'name', name);
    setIfMissing(website, 'url', origin);

    const pa = (website as JsonLd).potentialAction;
    if (pa && typeof pa === 'object' && !Array.isArray(pa)) {
      const target = (pa as Record<string, unknown>).target;
      if (typeof target === 'string') {
        const t = target.trim();
        if (t.startsWith('/')) (pa as Record<string, unknown>).target = `${origin}${t}`;
      }
    }
  }

  const out: { organization?: JsonLd; website?: JsonLd } = {};
  if (organization) out.organization = organization;
  if (website) out.website = website;
  return out;
}

/* ----------------------------- Product JSON-LD ----------------------------- */

function toStr(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function buildProductJsonLd(args: {
  product: Product;
  canonicalUrl: string;
  siteName?: string | null;
  images?: string[] | null; // already normalized URLs
  reviews?: ProductReview[] | null;
}): JsonLd | null {
  const { product, canonicalUrl } = args;

  const name = nonEmpty((product as Product)?.name);
  if (!name || !nonEmpty(canonicalUrl)) return null;

  const siteName = nonEmpty(args.siteName);

  // description: meta yoksa short_description; yoksa description html -> text
  const shortDesc = nonEmpty((product as Product)?.short_description);
  const descHtml = nonEmpty((product as Product)?.description);
  const descText = descHtml ? nonEmpty(stripHtmlToText(descHtml)) : '';
  const description = shortDesc || (descText ? truncateText(descText, 160) : '');

  const imagesRaw = Array.isArray(args.images) ? args.images : [];
  const images = imagesRaw.map((u) => imgSrc(u)).filter(Boolean) as string[];

  const price = (product as Product)?.price;
  const stockQty = (product as Product)?.stock_quantity;

  // availability: stok bilgisi varsa kullan; yoksa “InStock” iddiası atmayalım → availability omit etmek daha temiz
  const availability =
    typeof stockQty === 'number'
      ? stockQty > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
      : null;

  const out: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product?.id != null ? { sku: String(product.id) } : {}),
    ...(siteName ? { brand: { '@type': 'Brand', name: siteName } } : {}),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'TRY',
      ...(typeof price === 'number' || typeof price === 'string' ? { price } : {}),
      ...(availability ? { availability } : {}),
    },
  };

  const reviews = Array.isArray(args.reviews) ? args.reviews : [];
  const valid = reviews.filter(
    (r) => typeof (r as ProductReview)?.rating === 'number' && Number.isFinite((r as ProductReview).rating),
  );
  if (valid.length) {
    const total = valid.reduce((sum, r) => sum + (r as ProductReview).rating, 0);
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number((total / valid.length).toFixed(1)),
      reviewCount: valid.length,
    };

    out.review = valid.map((r) => {
      const rating = (r as ProductReview).rating;
      const authorName = nonEmpty((r as ProductReview)?.customer_name) || 'Müşteri';
      const reviewDate = nonEmpty((r as ProductReview)?.review_date);
      const comment = nonEmpty((r as ProductReview)?.comment);

      return {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: rating, bestRating: 5 },
        author: { '@type': 'Person', name: authorName },
        ...(reviewDate ? { datePublished: reviewDate } : {}),
        ...(comment ? { reviewBody: comment } : {}),
      };
    });
  }

  return out;
}

export function buildFaqJsonLd(faqs: ProductFaq[] | null | undefined): JsonLd | null {
  if (!Array.isArray(faqs) || !faqs.length) return null;

  const mainEntity = faqs
    .map((f) => {
      const q = nonEmpty((f as ProductFaq)?.question);
      const a = nonEmpty((f as ProductFaq)?.answer);
      if (!q || !a) return null;
      return {
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      };
    })
    .filter(Boolean);

  if (!mainEntity.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
