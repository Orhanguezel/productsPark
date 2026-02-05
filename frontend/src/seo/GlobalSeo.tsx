// =============================================================
// FILE: src/components/seo/GlobalSeo.tsx
// FINAL — Global SEO head (single source: /seo/meta)
// - Works with SeoHelmet: GlobalSeo does NOT set og:type/title/description/route images
// - Keeps: robots, icons, verification, GA/GTM, schema.org, optional default twitter card/site_name
// - exactOptionalPropertyTypes friendly
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSeoMetaQuery } from '@/integrations/hooks';
import { toStr, safeJsonLd } from '@/integrations/types';

const isValidGa4Id = (v: string) => /^G-[A-Z0-9]+$/i.test(v.trim());
const isValidGtmId = (v: string) => /^GTM-[A-Z0-9]+$/i.test(v.trim());

const nonEmpty = (v: unknown): string => {
  const s = toStr(v).trim();
  return s ? s : '';
};

export function GlobalSeo() {
  const { data } = useSeoMetaQuery();

  const robotsMeta = nonEmpty(data?.robots_meta);

  const faviconUrl = nonEmpty(data?.favicon_url);
  const appleTouchIcon = nonEmpty(data?.apple_touch_icon);
  const pwaIcon192 = nonEmpty(data?.pwa_icon_192);
  const pwaIcon512 = nonEmpty(data?.pwa_icon_512);

  const ogSiteName = nonEmpty(data?.og_site_name);

  const twitterSite = nonEmpty(data?.twitter_site);
  const twitterCard = nonEmpty(data?.twitter_card);

  const gsv = nonEmpty(data?.google_site_verification);
  const bsv = nonEmpty(data?.bing_site_verification);

  const gaIdRaw = nonEmpty(data?.analytics_ga_id);
  const gtmIdRaw = nonEmpty(data?.analytics_gtm_id);
  const gaId = gaIdRaw && isValidGa4Id(gaIdRaw) ? gaIdRaw : '';
  const gtmId = gtmIdRaw && isValidGtmId(gtmIdRaw) ? gtmIdRaw : '';

  const schemaEnabled = !!data?.schema_org_enabled;
  const org = schemaEnabled ? safeJsonLd(nonEmpty(data?.schema_org_organization)) : null;
  const web = schemaEnabled ? safeJsonLd(nonEmpty(data?.schema_org_website)) : null;

  const customHeader = nonEmpty(data?.custom_header_code);

  const gtmInlineInit = useMemo(() => {
    if (!gtmId) return '';
    // GTM head init only (noscript is in AppShell)
    return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
  }, [gtmId]);

  const gaInlineInit = useMemo(() => {
    if (!gaId) return '';
    return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`;
  }, [gaId]);

  const shouldRender =
    !!robotsMeta ||
    !!faviconUrl ||
    !!appleTouchIcon ||
    !!pwaIcon192 ||
    !!pwaIcon512 ||
    !!gsv ||
    !!bsv ||
    !!ogSiteName ||
    !!twitterCard ||
    !!twitterSite ||
    !!gtmId ||
    !!gaId ||
    !!customHeader ||
    (schemaEnabled && (!!org || !!web));

  if (!shouldRender) return null;

  return (
    <Helmet>
      {/* Robots (global default) */}
      {robotsMeta ? <meta name="robots" content={robotsMeta} /> : null}

      {/* Icons */}
      {faviconUrl ? <link rel="icon" href={faviconUrl} /> : null}
      {appleTouchIcon ? <link rel="apple-touch-icon" href={appleTouchIcon} /> : null}
      {pwaIcon192 ? <link rel="icon" type="image/png" sizes="192x192" href={pwaIcon192} /> : null}
      {pwaIcon512 ? <link rel="icon" type="image/png" sizes="512x512" href={pwaIcon512} /> : null}

      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Verification */}
      {gsv ? <meta name="google-site-verification" content={gsv} /> : null}
      {bsv ? <meta name="msvalidate.01" content={bsv} /> : null}

      {/* Global OG/Twitter (SAFE subset)
          IMPORTANT:
          - Do NOT set og:type here (SeoHelmet decides per route)
          - Do NOT set og:image/twitter:image here (SeoHelmet sets route image; RouteSeoLinks handles canonical)
      */}
      {ogSiteName ? <meta property="og:site_name" content={ogSiteName} /> : null}
      {twitterCard ? <meta name="twitter:card" content={twitterCard} /> : null}
      {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}

      {/* GTM head init */}
      {gtmId ? (
        <script
          key="gtm-init"
          dangerouslySetInnerHTML={{
            __html: gtmInlineInit,
          }}
        />
      ) : null}

      {/* GA4 */}
      {gaId ? (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        />
      ) : null}
      {gaId ? (
        <script
          key="ga-init"
          dangerouslySetInnerHTML={{
            __html: gaInlineInit,
          }}
        />
      ) : null}

      {/* Custom head code (intentionally NOT executed) */}
      {customHeader ? (
        <script
          type="text/plain"
          data-custom-head
          dangerouslySetInnerHTML={{ __html: customHeader }}
        />
      ) : null}

      {/* Schema.org (DB driven) */}
      {schemaEnabled && org ? (
        <script type="application/ld+json">{JSON.stringify(org)}</script>
      ) : null}
      {schemaEnabled && web ? (
        <script type="application/ld+json">{JSON.stringify(web)}</script>
      ) : null}
    </Helmet>
  );
}
