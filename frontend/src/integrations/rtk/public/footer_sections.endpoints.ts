// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/public/footer_sections_public.endpoints.ts
// FINAL — Public FooterSections RTK (central types + helpers)
// exactOptionalPropertyTypes: true uyumlu (params undefined set edilmez)
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type {
  ApiFooterSection,
  FooterSection,
  FooterSectionPublicListParams,
} from '@/integrations/types';
import { normalizeFooterSection, toFooterSectionPublicQuery } from '@/integrations/types';

const BASE = '/footer_sections';

export const footerSectionsPublicApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /footer_sections
    listFooterSections: b.query<FooterSection[], FooterSectionPublicListParams | void>({
      query: (p) => {
        const qp = p ? toFooterSectionPublicQuery(p) : undefined;

        return {
          url: BASE,
          ...(qp ? { params: qp } : {}), // ✅ params sadece varsa eklenir
        };
      },
      transformResponse: (res: unknown): FooterSection[] =>
        Array.isArray(res) ? (res as ApiFooterSection[]).map(normalizeFooterSection) : [],
      providesTags: (result) =>
        result?.length
          ? [
              { type: 'FooterSections' as const, id: 'LIST' },
              ...result.map((i) => ({ type: 'FooterSections' as const, id: i.id })),
            ]
          : [{ type: 'FooterSections' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /footer_sections/:id
    getFooterSectionById: b.query<FooterSection, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): FooterSection =>
        normalizeFooterSection(res as ApiFooterSection),
      providesTags: (_r, _e, id) => [{ type: 'FooterSections' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListFooterSectionsQuery, useGetFooterSectionByIdQuery } = footerSectionsPublicApi;
