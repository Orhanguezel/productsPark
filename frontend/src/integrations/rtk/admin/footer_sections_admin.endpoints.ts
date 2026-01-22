// ----------------------------------------------------------------------
// FILE: src/integrations/rtk/admin/footer_sections_admin.endpoints.ts
// FINAL — Admin FooterSections RTK (central types + helpers)
// exactOptionalPropertyTypes: true uyumlu (params undefined set edilmez)
// ----------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type {
  ApiFooterSection,
  FooterSection,
  FooterSectionAdminListParams,
  UpsertFooterSectionBody,
  ReorderFooterSectionItem,
} from '@/integrations/types';
import {
  normalizeFooterSection,
  toFooterSectionAdminBody,
  toFooterSectionAdminQuery,
} from '@/integrations/types';

const BASE = '/admin/footer_sections';

export const footerSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/footer_sections
    listFooterSectionsAdmin: b.query<FooterSection[], FooterSectionAdminListParams | void>({
      query: (p) => {
        const qp = p ? toFooterSectionAdminQuery(p) : undefined;

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

    // GET /admin/footer_sections/:id
    getFooterSectionAdminById: b.query<FooterSection, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): FooterSection =>
        normalizeFooterSection(res as ApiFooterSection),
      providesTags: (_r, _e, id) => [{ type: 'FooterSections' as const, id }],
    }),

    // POST /admin/footer_sections
    createFooterSectionAdmin: b.mutation<FooterSection, UpsertFooterSectionBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toFooterSectionAdminBody(body),
      }),
      transformResponse: (res: unknown): FooterSection =>
        normalizeFooterSection(res as ApiFooterSection),
      invalidatesTags: [{ type: 'FooterSections' as const, id: 'LIST' }],
    }),

    // PATCH /admin/footer_sections/:id
    updateFooterSectionAdmin: b.mutation<
      FooterSection,
      { id: string; body: UpsertFooterSectionBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toFooterSectionAdminBody(body),
      }),
      transformResponse: (res: unknown): FooterSection =>
        normalizeFooterSection(res as ApiFooterSection),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'FooterSections' as const, id: arg.id },
        { type: 'FooterSections' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/footer_sections/:id
    deleteFooterSectionAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'FooterSections' as const, id },
        { type: 'FooterSections' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/footer_sections/reorder
    reorderFooterSectionsAdmin: b.mutation<{ ok: true }, ReorderFooterSectionItem[]>({
      query: (items) => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body: { items },
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'FooterSections' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFooterSectionsAdminQuery,
  useGetFooterSectionAdminByIdQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
  useReorderFooterSectionsAdminMutation,
} = footerSectionsAdminApi;
