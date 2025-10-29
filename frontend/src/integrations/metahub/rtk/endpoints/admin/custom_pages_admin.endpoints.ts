// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { CustomPageRow, CustomPageView } from "../../../db/types/content";

const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

function extractHtml(rawField: unknown): string {
  // 1) string ise: JSON olabilir veya düz html olabilir
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
      return rawField; // düz html string
    }
  }
  // 2) obje ise ve html alanı varsa
  if (
    rawField &&
    typeof rawField === "object" &&
    typeof (rawField as Record<string, unknown>).html === "string"
  ) {
    return (rawField as Record<string, unknown>).html as string;
  }
  return "";
}

/** row→view (admin ve public aynı görünümü kullanacak) */
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

/** create/update body (FE) */
export type UpsertCustomPageBody = {
  title: string;
  slug: string;
  content: string; // HTML
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  locale?: string | null;
};

const toApiBody = (b: UpsertCustomPageBody) => {
  const title = (b.title ?? "").trim();
  const slug = (b.slug ?? "").trim();
  const html = b.content ?? "";
  const is_published = toBool(b.is_published);

  return {
    title,
    slug,
    content_html: html,
    // bazı BE’ler content’i JSON string istiyor:
    content: JSON.stringify({ html }),
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published,
    locale: b.locale ?? null,
  };
};

const BASE = "/admin/custom_pages";

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPagesAdmin: b.query<
      CustomPageView[],
      { locale?: string; limit?: number; offset?: number } | void
    >({
      query: () => ({ url: `${BASE}`}),
      transformResponse: (res: unknown): CustomPageView[] =>
        Array.isArray(res) ? (res as CustomPageRow[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "CustomPages" as const, id: p.id })),
              { type: "CustomPages" as const, id: "LIST" },
            ]
          : [{ type: "CustomPages" as const, id: "LIST" }],
    }),

    getCustomPageAdminById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "CustomPages", id }],
    }),

    createCustomPageAdmin: b.mutation<CustomPageView, UpsertCustomPageBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: [{ type: "CustomPages", id: "LIST" }],
    }),

    updateCustomPageAdmin: b.mutation<
      CustomPageView,
      { id: string; body: UpsertCustomPageBody }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBody(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CustomPages", id: arg.id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),

    deleteCustomPageAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CustomPages", id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesAdminQuery,
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
} = customPagesAdminApi;
