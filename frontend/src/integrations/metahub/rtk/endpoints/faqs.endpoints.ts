// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/faqs.endpoints.ts
// (Public FAQs)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Faq } from "@/integrations/metahub/rtk/types/faqs";

/**
 * Public list params -> backend'deki faqListQuerySchema ile uyumlu
 */
export type PublicFaqListParams = {
  q?: string;
  slug?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "display_order";
  orderDir?: "asc" | "desc";
};

type QueryParams = Record<string, string | number>;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Runtime type guard: gelen row gerçekten Faq mı? */
const isFaq = (v: unknown): v is Faq => {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.question === "string" &&
    typeof v.answer === "string" &&
    typeof v.slug === "string"
  );
};

/** RTK'nin listFaqs param tipi: PublicFaqListParams | void */
const toPublicFaqQuery = (
  p: PublicFaqListParams | void,
): QueryParams | undefined => {
  if (!p) return undefined;

  const qp: QueryParams = {};

  if (p.q && p.q.trim()) qp.q = p.q.trim();
  if (p.slug && p.slug.trim()) qp.slug = p.slug.trim();
  if (p.category && p.category.trim()) qp.category = p.category.trim();

  if (typeof p.limit === "number") qp.limit = p.limit;
  if (typeof p.offset === "number") qp.offset = p.offset;

  if (p.sort) qp.sort = p.sort;
  if (p.orderDir) qp.orderDir = p.orderDir;

  return Object.keys(qp).length ? qp : undefined;
};

export const faqsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /faqs (public list) */
    listFaqs: b.query<Faq[], PublicFaqListParams | void>({
      query: (params): FetchArgs => {
        const qp = toPublicFaqQuery(params);
        return qp ? { url: "/faqs", params: qp } : { url: "/faqs" };
      },
      transformResponse: (res: unknown): Faq[] => {
        if (Array.isArray(res)) {
          return res.filter(isFaq);
        }
        return [];
      },
      providesTags: (result) =>
        result && result.length
          ? [
            ...result.map((row) => ({ type: "Faqs" as const, id: row.id })),
            { type: "Faqs" as const, id: "PUBLIC_LIST" },
          ]
          : [{ type: "Faqs" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    /** GET /faqs/:id (public) */
    getFaq: b.query<Faq, string>({
      query: (id): FetchArgs => ({
        url: `/faqs/${encodeURIComponent(id)}`,
      }),
      transformResponse: (res: unknown): Faq => res as Faq,
      providesTags: (_r, _e, id) => [{ type: "Faqs" as const, id }],
      keepUnusedDataFor: 300,
    }),

    /** GET /faqs/by-slug/:slug (public) */
    getFaqBySlug: b.query<Faq, string>({
      query: (slug): FetchArgs => ({
        url: `/faqs/by-slug/${encodeURIComponent(slug)}`,
      }),
      transformResponse: (res: unknown): Faq => res as Faq,
      providesTags: (_r, _e, slug) => [
        { type: "Faqs" as const, id: `slug:${slug}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: true,
});

export const { useListFaqsQuery, useGetFaqQuery, useGetFaqBySlugQuery } =
  faqsApi;
