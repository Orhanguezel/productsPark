// ---------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/faqs_admin.endpoints.ts
// ---------------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { Faq, FaqListParams } from "@/integrations/metahub/db/types/faqs";

export type UpsertFaqInput = {
  question: string;
  answer: string;
  slug: string;
  category?: string | null;
  is_active?: boolean;
  display_order?: number;
};

export type PatchFaqInput = Partial<UpsertFaqInput>;

// FE → BE query map (admin)
function toAdminQuery(p?: FaqListParams) {
  if (!p) return undefined;

  const q: Record<string, unknown> = {};

  // Arama
  if (p.search) q.q = p.search;

  // Aktif / pasif filtre
  if (typeof p.active === "boolean") q.is_active = p.active;

  // Kategori
  if (p.category) q.category = p.category;

  // Limit / offset
  if (typeof p.limit === "number") q.limit = p.limit;
  if (typeof p.offset === "number") q.offset = p.offset;

  // Sıralama: orderParam = "display_order.asc" gibi
  if (p.orderBy && p.order) q.order = `${p.orderBy}.${p.order}`;

  return q;
}

export const faqsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/faqs
    listFaqsAdmin: b.query<Faq[], FaqListParams | void>({
      query: (p) =>
        p
          ? {
              url: "/admin/faqs",
              params: toAdminQuery(p) as Record<string, unknown>,
            }
          : {
              url: "/admin/faqs",
            },
      providesTags: (res) =>
        res && res.length
          ? [
              ...res.map((row) => ({ type: "Faqs" as const, id: row.id })),
              { type: "Faqs" as const, id: "LIST" },
            ]
          : [{ type: "Faqs" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/faqs/:id
    getFaqAdmin: b.query<Faq, string>({
      query: (id) => ({ url: `/admin/faqs/${id}` }),
      providesTags: (_res, _e, id) => [{ type: "Faqs" as const, id }],
    }),

    // GET /admin/faqs/by-slug/:slug
    getFaqBySlugAdmin: b.query<Faq, string>({
      query: (slug) => ({ url: `/admin/faqs/by-slug/${slug}` }),
      providesTags: (_res, _e, slug) => [
        { type: "Faqs" as const, id: `slug:${slug}` },
      ],
    }),

    // POST /admin/faqs
    createFaqAdmin: b.mutation<Faq, UpsertFaqInput>({
      query: (body) => ({
        url: "/admin/faqs",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // PATCH /admin/faqs/:id
    updateFaqAdmin: b.mutation<Faq, { id: string; patch: PatchFaqInput }>({
      query: ({ id, patch }) => ({
        url: `/admin/faqs/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (res, _e, arg) =>
        res?.id
          ? [
              { type: "Faqs" as const, id: res.id },
              { type: "Faqs" as const, id: "LIST" },
            ]
          : [
              { type: "Faqs" as const, id: arg.id },
              { type: "Faqs" as const, id: "LIST" },
            ],
    }),

    // DELETE /admin/faqs/:id
    removeFaqAdmin: b.mutation<void, string>({
      query: (id) => ({
        url: `/admin/faqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _e, id) => [
        { type: "Faqs" as const, id },
        { type: "Faqs" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFaqsAdminQuery,
  useGetFaqAdminQuery,
  useGetFaqBySlugAdminQuery,
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
  useRemoveFaqAdminMutation,
} = faqsAdminApi;
