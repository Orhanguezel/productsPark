// =============================================================
// FILE: src/components/seo/SeoJsonLd.tsx
// FINAL — SEO JSON-LD component
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import type { SiteSettings } from '@/integrations/types';
import { buildSiteJsonLd } from './jsonld';

type SeoJsonLdProps = {
  settings?: SiteSettings | null;
};

export default function SeoJsonLd({ settings }: SeoJsonLdProps) {
  const { organization, website } = useMemo(() => buildSiteJsonLd(settings), [settings]);

  if (!organization && !website) return null;

  return (
    <Helmet>
      {organization ? (
        <script type="application/ld+json">{JSON.stringify(organization)}</script>
      ) : null}
      {website ? <script type="application/ld+json">{JSON.stringify(website)}</script> : null}
    </Helmet>
  );
}
