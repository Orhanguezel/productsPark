// =============================================================
// FILE: src/integrations/rtk/public/sliders.endpoints.ts
// FINAL — Public Sliders RTK (central types + helpers)
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SliderPublic, SliderListParams } from '@/integrations/types';
import {
  normalizeSliderPublic,
  normalizeSliderPublicList,
  toSlidersPublicQuery,
} from '@/integrations/types';

const BASE = '/sliders';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['SliderPublic'] as const });

export const sliderPublicApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /sliders
    listSlidesPublic: b.query<SliderPublic[], SliderListParams | void>({
      query: (p) => {
        const qp = toSlidersPublicQuery(p);
        return {
          url: BASE,
          headers: { 'x-skip-auth': '1' },
          ...(qp ? { params: qp } : {}),
        };
      },
      transformResponse: (res: unknown): SliderPublic[] => normalizeSliderPublicList(res),
      providesTags: (res) =>
        res?.length
          ? [
              ...res.map((s) => ({ type: 'SliderPublic' as const, id: s.id })),
              { type: 'SliderPublic' as const, id: 'LIST' },
            ]
          : [{ type: 'SliderPublic' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /sliders/:idOrSlug
    getSlidePublic: b.query<SliderPublic, string>({
      query: (idOrSlug) => ({
        url: `${BASE}/${encodeURIComponent(idOrSlug)}`,
        headers: { 'x-skip-auth': '1' },
      }),
      transformResponse: (res: unknown): SliderPublic => normalizeSliderPublic(res),
      providesTags: (r) =>
        r
          ? [{ type: 'SliderPublic' as const, id: r.id }]
          : [{ type: 'SliderPublic' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useListSlidesPublicQuery, useGetSlidePublicQuery } = sliderPublicApi;
