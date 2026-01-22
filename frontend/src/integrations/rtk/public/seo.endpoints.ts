// =============================================================
// FILE: src/integrations/rtk/public/seo.endpoints.ts
// FINAL — Public SEO endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';

export type SeoMeta = {
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

const PUBLIC_BASE = '/seo';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['SeoMeta'] as const,
});

export const seoApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    seoMeta: b.query<SeoMeta, void>({
      query: () => ({ url: `${PUBLIC_BASE}/meta` }),
      providesTags: [{ type: 'SeoMeta' as const, id: 'GLOBAL' }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useSeoMetaQuery } = seoApi;
