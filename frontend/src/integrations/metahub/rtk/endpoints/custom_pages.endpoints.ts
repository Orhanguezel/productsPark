// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/custom_pages.endpoints.ts
// (public FE; slug ile get vs.)
// =============================================================
import { baseApi } from "../baseApi";
import type { CustomPageRow, CustomPageView } from "../../db/types/customPages";

const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : v == null ? null : String(v);

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

    // Görseller
    featured_image: strOrNull(r["featured_image"]),
    featured_image_asset_id: strOrNull(r["featured_image_asset_id"]),
    featured_image_alt: strOrNull(r["featured_image_alt"]),

    meta_title:
      (typeof r["meta_title"] === "string" ? r["meta_title"] : null) ?? null,
    meta_description:
      (typeof r["meta_description"] === "string" ? r["meta_description"] : null) ?? null,
    is_published: toBool(r["is_published"]),
    created_at: typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined,
    updated_at: typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined,
  };
};

const BASE = "/custom_pages";

export const customPagesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPages: b.query<
      CustomPageView[],
      { locale?: string; is_published?: boolean | 0 | 1; limit?: number; offset?: number }
    >({
      query: (params) => ({ url: `${BASE}`, params }),
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
      query: ({ slug, locale }) => ({ url: `${BASE}/by-slug/${slug}`, params: { locale } }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, { slug }) => [{ type: "CustomPage", id: `SLUG_${slug}` }],
    }),

    getCustomPageById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
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
