// FILE: src/integrations/metahub/rtk/endpoints/categories.endpoints.ts
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Category } from "../types/categories";

/* ================= utils (type-safe, any yok) ================= */
type UnknownRec = Readonly<Record<string, unknown>>;
const isObj = (v: unknown): v is UnknownRec => !!v && typeof v === "object" && !Array.isArray(v);

const toStr = (x: unknown): string => (x == null ? "" : String(x).trim());
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x));
const toBool = (x: unknown, d = false): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x ?? "").toLowerCase();
  if (["1", "true", "yes", "y", "on", "active", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "inactive", "disabled"].includes(s)) return false;
  return d;
};

const pick = (o: unknown, keys: string[]): unknown => {
  if (!isObj(o)) return null;
  for (const k of keys) {
    const v = o[k];
    if (v != null) return v;
  }
  return null;
};
const pickStr = (o: unknown, keys: string[]) => {
  const v = pick(o, keys);
  return v == null ? null : toStr(v);
};

const pluckArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObj(res)) {
    for (const k of ["data", "items", "rows", "result", "categories"]) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const normalizePublic = (c: unknown): Category => {
  const o = c as UnknownRec;
  return {
    id: toStr(o.id),
    name: toStr(o.name),
    slug: toStr(pickStr(o, ["slug", "category_slug", "url_slug"]) ?? ""),
    description: (o.description ?? null) as string | null,

    image_url: (pickStr(o, ["image_url", "banner_image_url", "featured_image", "cover_image_url", "image", "imageUrl"]) ?? null),
    image_asset_id: (pickStr(o, ["image_asset_id", "featured_image_asset_id", "asset_id", "imageId"]) ?? null),
    image_alt: (pickStr(o, ["image_alt", "alt", "alt_text", "altText"]) ?? null),

    icon: (o.icon ?? null) as string | null,
    parent_id: (pickStr(o, ["parent_id", "parentId", "parent"]) ?? null),

    is_active: toBool(o.is_active ?? (o as UnknownRec).active ?? (o as UnknownRec).enabled, false),
    is_featured: toBool((o as UnknownRec).is_featured ?? (o as UnknownRec).featured ?? (o as UnknownRec).isFeatured, false),
    display_order: toNum(o.display_order ?? (o as UnknownRec).order ?? (o as UnknownRec).sort ?? 0),

    seo_title: pickStr(o, ["seo_title", "meta_title", "title"]),
    seo_description: pickStr(o, ["seo_description", "meta_description"]),

    article_enabled: (o.article_enabled == null ? null : toBool(o.article_enabled)),
    article_content: (o.article_content ?? null) as string | null,

    created_at: o.created_at as string | undefined,
    updated_at: o.updated_at as string | undefined,
  };
};

/* ================= params & endpoint ================= */
export type PublicListParams = {
  q?: string;
  parent_id?: string | null;     // "null" → ana kategoriler
  is_active?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "name" | "created_at" | "updated_at";
  order?: "asc" | "desc";
};

type QueryParams = Record<string, string | number | boolean>;
const toQueryParams = (p?: PublicListParams): QueryParams | null => {
  if (!p) return null;
  const qp: QueryParams = {};
  if (p.q) qp.q = p.q;
  if (p.parent_id !== undefined) qp.parent_id = p.parent_id ?? "null";
  if (p.is_active !== undefined) qp.is_active = p.is_active ? 1 : 0;
  if (p.is_featured !== undefined) qp.is_featured = p.is_featured ? 1 : 0;
  if (typeof p.limit === "number") qp.limit = p.limit;
  if (typeof p.offset === "number") qp.offset = p.offset;
  if (p.sort) qp.sort = p.sort;
  if (p.order) qp.order = p.order;
  return Object.keys(qp).length ? qp : null;
};

const BASE = "/categories";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<Category[], PublicListParams | void>({
      query: (params): FetchArgs => {
        const qp = toQueryParams(params as PublicListParams | undefined);
        return qp ? { url: BASE, params: qp } : { url: BASE };
      },
      transformResponse: (res: unknown): Category[] => pluckArray(res).map(normalizePublic),
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
      transformResponse: (res: unknown): Category => normalizePublic(res),
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCategoriesQuery, useGetCategoryByIdQuery } = categoriesApi;
