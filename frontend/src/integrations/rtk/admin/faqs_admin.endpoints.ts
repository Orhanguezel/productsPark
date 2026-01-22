// ---------------------------------------------------------------------
// FILE: src/integrations/rtk/admin/faqs_admin.endpoints.ts
// FINAL — Admin FAQs RTK (central types + query helper)
// exactOptionalPropertyTypes: true uyumlu (params undefined set edilmez)
// ---------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type { Faq, FaqListParams, UpsertFaqInput, PatchFaqInput } from '@/integrations/types';
import { toFaqsAdminQuery } from '@/integrations/types';

const BASE = '/admin/faqs';

export const faqsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/faqs
    listFaqsAdmin: b.query<Faq[], FaqListParams | void>({
      query: (p) => {
        const params = p ? toFaqsAdminQuery(p) : undefined;

        return {
          url: BASE,
          ...(params ? { params } : {}), // ✅ params sadece varsa eklenir
        };
      },
      providesTags: (res) =>
        res?.length
          ? [
              { type: 'Faqs' as const, id: 'LIST' },
              ...res.map((r) => ({ type: 'Faqs' as const, id: r.id })),
            ]
          : [{ type: 'Faqs' as const, id: 'LIST' }],
      keepUnusedDataFor: 30,
    }),

    // GET /admin/faqs/:id
    getFaqAdminById: b.query<Faq, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      providesTags: (_res, _e, id) => [{ type: 'Faqs' as const, id }],
    }),

    // GET /admin/faqs/by-slug/:slug
    getFaqAdminBySlug: b.query<Faq, string>({
      query: (slug) => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}` }),
      providesTags: (_res, _e, slug) => [{ type: 'Faqs' as const, id: `SLUG_${slug}` }],
    }),

    // POST /admin/faqs
    createFaqAdmin: b.mutation<Faq, UpsertFaqInput>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      invalidatesTags: [{ type: 'Faqs' as const, id: 'LIST' }],
    }),

    // PATCH /admin/faqs/:id
    updateFaqAdmin: b.mutation<Faq, { id: string; patch: PatchFaqInput }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Faqs' as const, id: arg.id },
        { type: 'Faqs' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/faqs/:id  (204)
    removeFaqAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_res, _e, id) => [
        { type: 'Faqs' as const, id },
        { type: 'Faqs' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFaqsAdminQuery,
  useGetFaqAdminByIdQuery,
  useGetFaqAdminBySlugQuery,
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
  useRemoveFaqAdminMutation,
} = faqsAdminApi;
