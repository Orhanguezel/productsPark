// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/categories.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Category } from "../../db/types/categories";

// Basit normalize (public endpoint'ten gelenleri güvene al)
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x));
const toStr = (x: unknown): string => (x == null ? "" : String(x));

const normalizePublic = (c): Category => ({
  id: toStr(c.id).trim(),
  name: toStr(c.name).trim(),
  slug: toStr(c.slug).trim(),
  description: (c.description ?? null) as string | null,

  image_url: (c.image_url ?? null) as string | null,
  image_asset_id: (c.image_asset_id ?? null) as string | null,
  image_alt: (c.image_alt ?? null) as string | null,

  icon: (c.icon ?? null) as string | null,
  parent_id: (c.parent_id ?? null) as string | null,

  is_active: toBool(c.is_active),
  is_featured: toBool(c.is_featured),
  display_order: toNum(c.display_order),

  seo_title: (c.seo_title ?? null) as string | null,
  seo_description: (c.seo_description ?? null) as string | null,

  article_enabled: c.article_enabled == null ? null : toBool(c.article_enabled),
  article_content: (c.article_content ?? null) as string | null,

  created_at: c.created_at,
  updated_at: c.updated_at,
});

const BASE = "/categories";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<Category[], void>({
      query: (): FetchArgs => ({ url: BASE }),
      transformResponse: (res: unknown): Category[] =>
        Array.isArray(res) ? (res as unknown[]).map(normalizePublic) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Categories" as const, id: c.id })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
    }),
    getCategoryById: builder.query<Category, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): Category => normalizePublic(res as unknown),
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCategoriesQuery, useGetCategoryByIdQuery } = categoriesApi;
