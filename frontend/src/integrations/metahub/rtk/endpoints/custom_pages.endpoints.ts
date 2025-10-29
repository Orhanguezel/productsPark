// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/custom_pages.endpoints.ts
// (public FE; slug ile get vs.)
// =============================================================
import { baseApi as baseApi_m3 } from "../baseApi";
import type { CustomPageRow, CustomPageView } from "../../db/types/content";

const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

function extractHtml(rawField: unknown): string {
  if (typeof rawField === "string") {
    try {
      const parsed = JSON.parse(rawField) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as Record<string, unknown>).html === "string"
      ) {
        return (parsed as Record<string, unknown>).html as string;
      }
      return rawField;
    } catch {
      return rawField;
    }
  }
  if (
    rawField &&
    typeof rawField === "object" &&
    typeof (rawField as Record<string, unknown>).html === "string"
  ) {
    return (rawField as Record<string, unknown>).html as string;
  }
  return "";
}

/** raw→view */
const toView = (row: unknown): CustomPageView => {
  const r = (row ?? {}) as Record<string, unknown>;
  const raw = r["content_html"] ?? r["content"];

  return {
    id: String(r["id"] ?? ""),
    title: String(r["title"] ?? ""),
    slug: String(r["slug"] ?? ""),
    content: extractHtml(raw),
    meta_title:
      (typeof r["meta_title"] === "string" ? r["meta_title"] : null) ?? null,
    meta_description:
      (typeof r["meta_description"] === "string" ? r["meta_description"] : null) ?? null,
    is_published: toBool(r["is_published"]),
    created_at: typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined,
    updated_at: typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined,
  };
};

export const customPagesApi = baseApi_m3.injectEndpoints({
  endpoints: (b) => ({
    listCustomPages: b.query<
      CustomPageView[],
      { locale?: string; is_published?: boolean | 0 | 1; limit?: number; offset?: number }
    >({
      query: (params) => ({ url: "/custom_pages", params }),
      transformResponse: (res: unknown): CustomPageView[] =>
        Array.isArray(res) ? (res as CustomPageRow[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "CustomPage" as const, id: p.id })),
              { type: "CustomPages" as const, id: "LIST" },
            ]
          : [{ type: "CustomPages" as const, id: "LIST" }],
    }),

    getCustomPageBySlug: b.query<CustomPageView, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => ({ url: `/custom_pages/by-slug/${slug}`, params: { locale } }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, { slug }) => [{ type: "CustomPage", id: `SLUG_${slug}` }],
    }),

    getCustomPageById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `/custom_pages/${id}` }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "CustomPage", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesQuery,
  useGetCustomPageBySlugQuery,
  useGetCustomPageByIdQuery,
} = customPagesApi;
