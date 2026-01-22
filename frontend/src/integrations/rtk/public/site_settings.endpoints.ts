// =============================================================
// FILE: src/integrations/rtk/public/site_settings.endpoints.ts
// FINAL — Public SiteSettings RTK (central types + helpers)
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SiteSetting, SiteSettingsPublicListParams } from '@/integrations/types';
import {
  normalizePublicSiteSetting,
  normalizePublicSiteSettingList,
  toPublicSiteSettingsQuery,
} from '@/integrations/types';

const PUBLIC_BASE = '/site_settings';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['SiteSettings'] as const,
});

export const siteSettingsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /site_settings */
    listSiteSettings: b.query<SiteSetting[], SiteSettingsPublicListParams>({
      query: (p) => {
        const qp = toPublicSiteSettingsQuery(p);
        return {
          url: PUBLIC_BASE,
          ...(qp ? { params: qp } : {}), // ✅
        };
      },
      transformResponse: (res: unknown): SiteSetting[] => normalizePublicSiteSettingList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    /** GET /site_settings/:key */
    getSiteSettingByKey: b.query<SiteSetting | null, string>({
      query: (key) => ({ url: `${PUBLIC_BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): SiteSetting | null => normalizePublicSiteSetting(res),
      providesTags: (_r, _e, key) => [{ type: 'SiteSettings' as const, id: key }],
    }),
  }),
  overrideExisting: true,
});

export const { useListSiteSettingsQuery, useGetSiteSettingByKeyQuery } = siteSettingsApi;
