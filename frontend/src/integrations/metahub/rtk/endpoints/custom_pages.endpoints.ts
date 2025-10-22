
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/custom_pages.endpoints.ts
// =============================================================
import { baseApi as baseApi_m3 } from "../baseApi";

type BoolLike3 = 0 | 1 | boolean;

export type CustomPage = {
  id: string;
  title: string;
  slug: string;
  locale?: string | null;
  content_html?: string | null;
  is_published?: BoolLike3;
  created_at?: string;
  updated_at?: string;
};

export const customPagesApi = baseApi_m3.injectEndpoints({
  endpoints: (b) => ({
    listCustomPages: b.query<CustomPage[], { locale?: string; is_published?: BoolLike3; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/custom_pages", params }),
      transformResponse: (res: unknown): CustomPage[] => Array.isArray(res) ? (res as CustomPage[]) : [],
      providesTags: (result) => result
        ? [...result.map((p) => ({ type: "CustomPage" as const, id: p.id })), { type: "CustomPages" as const, id: "LIST" }]
        : [{ type: "CustomPages" as const, id: "LIST" }],
    }),

    getCustomPageBySlug: b.query<CustomPage, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => ({ url: `/custom_pages/by-slug/${slug}`, params: { locale } }),
      transformResponse: (res: unknown): CustomPage => res as CustomPage,
      providesTags: (_r, _e, { slug }) => [{ type: "CustomPage", id: `SLUG_${slug}` }],
    }),

    getCustomPageById: b.query<CustomPage, string>({
      query: (id) => ({ url: `/custom_pages/${id}` }),
      transformResponse: (res: unknown): CustomPage => res as CustomPage,
      providesTags: (_r, _e, id) => [{ type: "CustomPage", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCustomPagesQuery, useGetCustomPageBySlugQuery, useGetCustomPageByIdQuery } = customPagesApi;
