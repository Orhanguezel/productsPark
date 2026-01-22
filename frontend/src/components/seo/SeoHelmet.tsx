// =============================================================
// FILE: src/components/seo/SeoHelmet.tsx
// FINAL — Route-level SEO (title/description + OG/Twitter + robots + JSON-LD)
// - Canonical/hreflang is handled by <RouteSeoLinks /> (global)
// - Global defaults (og:site_name, twitter:card/site, robots default, etc.) are handled by <GlobalSeo />
// - No fallbacks: emits tags only when values exist
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { nonEmpty, getOrigin } from '@/integrations/types';

export type SeoHelmetProps = {
  title?: string | null;
  description?: string | null;

  /** "website" default; use "article" for blog detail etc. */
  ogType?: 'website' | 'article';

  /** if provided, emits og:image + twitter:image */
  imageUrl?: string | null;

  /** if provided, emits og:url */
  url?: string | null;

  /** overrides robots for this route only (e.g., noindex) */
  robots?: string | null;

  /** override twitter card if you want (otherwise GlobalSeo may set default) */
  twitterCard?: string | null;

  /** additional meta if needed */
  meta?: Array<{ name?: string; property?: string; content: string }>;

  /**
   * JSON-LD structured data.
   * - pass a single object, or an array of objects
   * - will be emitted as application/ld+json
   */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

export default function SeoHelmet(props: SeoHelmetProps) {
  const title = nonEmpty(props.title);
  const description = nonEmpty(props.description);

  const robots = nonEmpty(props.robots);
  const ogType = props.ogType ?? 'website';

  const imageUrl = nonEmpty(props.imageUrl);
  const twitterCard = nonEmpty(props.twitterCard);

  // If url not passed, best-effort using origin + current pathname (only in browser)
  const url = useMemo(() => {
    const u = nonEmpty(props.url);
    if (u) return u;

    const origin = getOrigin();
    if (!origin) return '';
    if (typeof window === 'undefined') return '';

    const path = window.location?.pathname || '/';
    return `${origin}${path}`;
  }, [props.url]);

  const extraMeta = props.meta ?? [];

  const jsonLd = props.jsonLd ?? null;
  const jsonLdString = useMemo(() => {
    if (!jsonLd) return '';
    try {
      return JSON.stringify(jsonLd);
    } catch {
      return '';
    }
  }, [jsonLd]);

  // IMPORTANT: do NOT include ogType in shouldRender; it's always set (default "website")
  const shouldRender =
    !!title ||
    !!description ||
    !!robots ||
    !!imageUrl ||
    !!nonEmpty(url) ||
    !!twitterCard ||
    !!extraMeta.length ||
    !!jsonLdString;

  if (!shouldRender) return null;

  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}

      {/* OpenGraph (route-level) */}
      <meta property="og:type" content={ogType} />
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}
      {url ? <meta property="og:url" content={url} /> : null}
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}

      {/* Twitter (route-level) */}
      {twitterCard ? <meta name="twitter:card" content={twitterCard} /> : null}
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? <meta name="twitter:description" content={description} /> : null}
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}

      {/* Extra meta */}
      {extraMeta.map((m, i) => {
        const content = nonEmpty(m.content);
        if (!content) return null;

        if (m.property) return <meta key={`m-${i}`} property={m.property} content={content} />;
        if (m.name) return <meta key={`m-${i}`} name={m.name} content={content} />;
        return null;
      })}

      {/* JSON-LD */}
      {jsonLdString ? <script type="application/ld+json">{jsonLdString}</script> : null}
    </Helmet>
  );
}
