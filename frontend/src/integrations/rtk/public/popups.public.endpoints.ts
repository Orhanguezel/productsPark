// ===================================================================
// FILE: src/integrations/rtk/public/popups_public.endpoints.ts
// FINAL — Popups (PUBLIC) RTK
// - no any
// - exactOptionalPropertyTypes friendly
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type { CampaignPopupView, PopupListQuery } from '@/integrations/types';
import {
  normalizeCampaignPopup,
  normalizeCampaignPopupList,
  toPopupListQueryParams,
} from '@/integrations/types';

const BASE = '/popups';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['Popups', 'Popup'] as const,
});

export const popupsPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /popups */
    listPopupsPublic: b.query<CampaignPopupView[], PopupListQuery | void>({
      query: (q) => {
        const qp = q ? toPopupListQueryParams(q) : undefined;
        return {
          url: BASE,
          method: 'GET',
          ...(qp ? { params: qp } : {}),
          // Eğer auth skip gerekiyorsa:
          // headers: { 'x-skip-auth': '1' },
        };
      },
      transformResponse: (res: unknown): CampaignPopupView[] => normalizeCampaignPopupList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'Popup' as const, id: x.id })),
              { type: 'Popups' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'Popups' as const, id: 'PUBLIC_LIST' }],
      keepUnusedDataFor: 20,
    }),

    /** GET /popups/by-key/:key */
    getPopupByKeyPublic: b.query<CampaignPopupView, { key: string; locale?: string }>({
      query: ({ key, locale }) => {
        const qp = toPopupListQueryParams(locale ? { locale } : undefined);
        return {
          url: `${BASE}/by-key/${encodeURIComponent(key)}`,
          method: 'GET',
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): CampaignPopupView => normalizeCampaignPopup(res),
      providesTags: (_r, _e, arg) => [{ type: 'Popup' as const, id: `key:${arg.key}` }],
      keepUnusedDataFor: 30,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPopupsPublicQuery,
  useLazyListPopupsPublicQuery,
  useGetPopupByKeyPublicQuery,
  useLazyGetPopupByKeyPublicQuery,
} = popupsPublicApi;
