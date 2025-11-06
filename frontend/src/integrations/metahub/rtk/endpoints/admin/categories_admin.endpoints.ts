// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Category, ApiCategory, UpsertCategoryBody } from "../../../db/types/categories";

/* ----------------------------- helpers ----------------------------- */

type UnknownRec = Readonly<Record<string, unknown>>;
const isObj = (v: unknown): v is UnknownRec => !!v && typeof v === "object" && !Array.isArray(v);

const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x));
const toStr = (v: unknown): string => (v == null ? "" : String(v));

const toBoolLoose = (x: unknown, fallback = false): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "on", "active", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "inactive", "disabled"].includes(s)) return false;
  return fallback;
};

const pickFirst = <T = unknown>(src: unknown, keys: readonly string[], map?: (v: unknown) => T): T | null => {
  if (!isObj(src)) return null;
  for (const k of keys) {
    const val = src[k];
    if (val != null) return map ? map(val) : (val as T);
  }
  return null;
};

const pickString = (src: unknown, keys: readonly string[]): string | null =>
  pickFirst<string>(src, keys, (v) => toStr(v).trim());

const pickNumber = (src: unknown, keys: readonly string[], d = 0): number =>
  pickFirst<number>(src, keys, (v) => toNum(v)) ?? d;

const pickBool = (src: unknown, keys: readonly string[], d = false): boolean =>
  pickFirst<boolean>(src, keys, (v) => toBoolLoose(v, d)) ?? d;

/** basit slugify (tr karakterleri sadeleştir) */
const slugify = (v: string): string =>
  (v || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pickSlug = (c: unknown, name: string): string => {
  const s = pickString(c, ["slug", "category_slug", "url_slug"]);
  return (s && s.length > 0) ? s : slugify(name);
};

/** Görsel alanları — farklı isim varyantları + nested image.url */
const pickImageUrl = (c: UnknownRec): string | null => {
  const direct = pickString(c, ["image_url", "banner_image_url", "featured_image", "cover_image_url", "image", "imageUrl"]);
  if (direct) return direct;
  const img = c["image"];
  if (isObj(img)) {
    const nested = pickString(img, ["url", "src"]);
    if (nested) return nested;
  }
  return null;
};

const pickImageAssetId = (c: unknown): string | null =>
  pickString(c, ["image_asset_id", "featured_image_asset_id", "asset_id", "imageId"]);

const pickImageAlt = (c: unknown): string | null =>
  pickString(c, ["image_alt", "alt", "alt_text", "altText"]);

const pickSeoTitle = (c: unknown): string | null =>
  pickString(c, ["seo_title", "meta_title", "title"]);

const pickSeoDescription = (c: unknown): string | null =>
  pickString(c, ["seo_description", "meta_description"]);

/** Normalize (liste & tek kayıt) — any kullanmadan */
const normalizeCategory = (src: ApiCategory): Category => {
  const o = src as unknown as UnknownRec;
  const name = toStr(o.name).trim();

  // Booleans: response hiç getirmediyse güvenli varsayılanlar
  const activeRaw = pickFirst(o, ["is_active", "active", "enabled", "status"]);
  const is_active = activeRaw == null ? true : toBoolLoose(activeRaw, true);

  const featuredRaw = pickFirst(o, ["is_featured", "featured", "isFeatured"]);
  const is_featured = featuredRaw == null ? false : toBoolLoose(featuredRaw, false);

  return {
    id: toStr(o.id).trim(),
    name,
    slug: pickSlug(o, name),
    description: (o.description ?? null) as string | null,

    image_url: pickImageUrl(o),
    image_asset_id: pickImageAssetId(o),
    image_alt: pickImageAlt(o),

    icon: (o.icon ?? null) as string | null,
    parent_id: (pickString(o, ["parent_id", "parentId", "parent"]) ?? null),

    is_active,
    is_featured,
    display_order: pickNumber(o, ["display_order", "order", "sort", "position", "rank", "priority"], 0),

    seo_title: pickSeoTitle(o),
    seo_description: pickSeoDescription(o),

    article_enabled: pickFirst<boolean>(o, ["article_enabled"], (v) => toBoolLoose(v)) ?? null,
    article_content: (o.article_content ?? null) as string | null,

    created_at: o.created_at as string | undefined,
    updated_at: o.updated_at as string | undefined,
  };
};

/* --------------------------- query params --------------------------- */

export type ListParams = {
  q?: string;
  parent_id?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "name" | "created_at" | "updated_at";
  order?: "asc" | "desc";
};

type QueryParamsStrict = Record<string, string | number | boolean>;

const toQueryParams = (p?: ListParams): QueryParamsStrict | null => {
  if (!p) return null;
  const qp: QueryParamsStrict = {};
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

/* ------------------------------ endpoints ------------------------------ */

const BASE = "/categories"; // BE admin router bu prefix ile çalışıyor (senin projende doğru)

const withCompat = (body: UpsertCategoryBody) => ({
  ...body,
  meta_title: body.seo_title ?? (body as { meta_title?: string | null }).meta_title ?? undefined,
  meta_description:
    body.seo_description ??
    (body as { meta_description?: string | null }).meta_description ??
    undefined,
});

/** [data|items|rows|result|categories] pluck */
const pluckArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObj(res)) {
    for (const k of ["data", "items", "rows", "result", "categories"] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

export const categoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategoriesAdmin: b.query<Category[], ListParams | void>({
      query: (params): FetchArgs => {
        const qp = toQueryParams(params as ListParams | undefined);
        return qp ? { url: `${BASE}`, params: qp } : { url: `${BASE}` };
      },
      transformResponse: (res: unknown): Category[] =>
        pluckArray(res).map((x) => normalizeCategory(x as ApiCategory)),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Categories" as const, id: c.id })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),

    getCategoryAdminById: b.query<Category, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),

    getCategoryAdminBySlug: b.query<Category | null, string>({
      query: (slug): FetchArgs => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Category | null =>
        res ? normalizeCategory(res as ApiCategory) : null,
      providesTags: (_r, _e, slug) => [{ type: "Categories", id: `SLUG_${slug}` }],
    }),

    createCategoryAdmin: b.mutation<Category, UpsertCategoryBody>({
      query: (body): FetchArgs => ({ url: `${BASE}`, method: "POST", body: withCompat(body) }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
              draft.unshift(created);
            }),
          );
        } catch { /* no-op */ }
      },
    }),

    updateCategoryAdmin: b.mutation<Category, { id: string; body: UpsertCategoryBody }>({
      query: ({ id, body }): FetchArgs => ({ url: `${BASE}/${id}`, method: "PUT", body: withCompat(body) }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Categories", id: arg.id },
        { type: "Categories", id: "LIST" },
      ],
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
            const it = draft.find((d) => d.id === id);
            if (!it) return;

            if (body.name !== undefined) it.name = body.name;
            if (body.slug !== undefined) it.slug = (body.slug || "").trim();
            if (body.description !== undefined) it.description = body.description ?? null;

            if (body.image_url !== undefined) it.image_url = body.image_url ?? it.image_url ?? null;
            if (body.image_asset_id !== undefined) it.image_asset_id = body.image_asset_id ?? null;
            if (body.image_alt !== undefined) it.image_alt = body.image_alt ?? null;

            if (body.icon !== undefined) it.icon = body.icon ?? null;
            if (body.parent_id !== undefined) it.parent_id = body.parent_id ?? null;
            if (body.is_active !== undefined) it.is_active = !!body.is_active;
            if (body.is_featured !== undefined) it.is_featured = !!body.is_featured;
            if (body.display_order !== undefined) it.display_order = body.display_order ?? 0;

            if (body.seo_title !== undefined)
              it.seo_title = body.seo_title ?? (body as { meta_title?: string | null }).meta_title ?? null;
            if (body.seo_description !== undefined)
              it.seo_description =
                body.seo_description ??
                (body as { meta_description?: string | null }).meta_description ??
                null;

            if (body.article_enabled !== undefined) it.article_enabled = body.article_enabled ?? null;
            if (body.article_content !== undefined) it.article_content = body.article_content ?? null;
          }),
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
              const i = draft.findIndex((d) => d.id === id);
              if (i >= 0) draft[i] = updated;
            }),
          );
          dispatch(categoriesAdminApi.util.updateQueryData("getCategoryAdminById", id, () => updated));
        } catch {
          patchList.undo();
        }
      },
    }),

    deleteCategoryAdmin: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
            const i = draft.findIndex((d) => d.id === id);
            if (i >= 0) draft.splice(i, 1);
          }),
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),

    reorderCategoriesAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items): FetchArgs => ({ url: `${BASE}/reorder`, method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
      async onQueryStarted(items, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
            const map = new Map<string, number>(items.map((i) => [i.id, i.display_order]));
            draft.forEach((d) => {
              const n = map.get(d.id);
              if (typeof n === "number") d.display_order = n;
            });
            draft.sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
          }),
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),

    toggleActiveCategoryAdmin: b.mutation<Category, { id: string; is_active: boolean }>({
      query: ({ id, is_active }): FetchArgs => ({ url: `${BASE}/${id}/active`, method: "PATCH", body: { is_active } }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Categories", id: arg.id },
        { type: "Categories", id: "LIST" },
      ],
      async onQueryStarted({ id, is_active }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
            const item = draft.find((d) => d.id === id);
            if (item) item.is_active = is_active;
          }),
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),

    toggleFeaturedCategoryAdmin: b.mutation<Category, { id: string; is_featured: boolean }>({
      query: ({ id, is_featured }): FetchArgs => ({ url: `${BASE}/${id}/featured`, method: "PATCH", body: { is_featured } }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Categories", id: arg.id },
        { type: "Categories", id: "LIST" },
      ],
      async onQueryStarted({ id, is_featured }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          categoriesAdminApi.util.updateQueryData("listCategoriesAdmin", undefined, (draft) => {
            const item = draft.find((d) => d.id === id);
            if (item) item.is_featured = is_featured;
          }),
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCategoriesAdminQuery,
  useGetCategoryAdminByIdQuery,
  useGetCategoryAdminBySlugQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
  useReorderCategoriesAdminMutation,
  useToggleActiveCategoryAdminMutation,
  useToggleFeaturedCategoryAdminMutation,
} = categoriesAdminApi;
