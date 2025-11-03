// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  Category,
  ApiCategory,
  UpsertCategoryBody,
} from "../../../db/types/categories";

/* ----------------------------- helpers ----------------------------- */

const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x);

const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};

const toStr = (v: unknown): string => (v == null ? "" : String(v));

/** Güvenli string alan seçici (unknown → string|null) */
const pickFirstString = (src: unknown, keys: string[]): string | null => {
  if (!src || typeof src !== "object") return null;
  const obj = src as Record<string, unknown>;
  for (const k of keys) {
    const val = obj[k];
    if (val != null) return String(val);
  }
  return null;
};

/** slug & seo alanları için BE uyumluluğu */
const pickSlug = (c: unknown): string =>
  pickFirstString(c, ["slug", "category_slug", "url_slug"]) ?? "";

const pickSeoTitle = (c: unknown): string | null =>
  pickFirstString(c, ["seo_title", "meta_title"]);

const pickSeoDescription = (c: unknown): string | null =>
  pickFirstString(c, ["seo_description", "meta_description"]);

/** Normalize incoming API record */
const normalizeCategory = (c: ApiCategory): Category => ({
  id: toStr((c as unknown as { id?: unknown }).id).trim(),
  name: toStr((c as unknown as { name?: unknown }).name).trim(),
  slug: toStr(pickSlug(c)).trim(),
  description: ((c as unknown as { description?: unknown }).description ?? null) as string | null,

  image_url: ((c as unknown as { image_url?: unknown }).image_url ?? null) as string | null,
  image_asset_id: ((c as unknown as { image_asset_id?: unknown }).image_asset_id ?? null) as string | null,
  image_alt: ((c as unknown as { image_alt?: unknown }).image_alt ?? null) as string | null,

  icon: ((c as unknown as { icon?: unknown }).icon ?? null) as string | null,
  parent_id: ((c as unknown as { parent_id?: unknown }).parent_id ?? null) as string | null,

  is_active: toBool((c as unknown as { is_active: unknown }).is_active),
  is_featured: toBool((c as unknown as { is_featured: unknown }).is_featured),
  display_order: toNumber((c as unknown as { display_order: unknown }).display_order),

  // seo_* || meta_* uyumu
  seo_title: pickSeoTitle(c),
  seo_description: pickSeoDescription(c),

  article_enabled:
    (c as unknown as { article_enabled?: unknown }).article_enabled == null
      ? null
      : toBool((c as unknown as { article_enabled?: unknown }).article_enabled),
  article_content: ((c as unknown as { article_content?: unknown }).article_content ?? null) as string | null,

  created_at: (c as unknown as { created_at?: string }).created_at,
  updated_at: (c as unknown as { updated_at?: string }).updated_at,
});

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

const BASE = "/categories";

/** BE uyumluluğu: isteklerde seo_* kopyasını meta_* olarak da gönder */
const withCompat = (body: UpsertCategoryBody) => ({
  ...body,
  meta_title: body.seo_title ?? (body as { meta_title?: string | null }).meta_title ?? undefined,
  meta_description:
    body.seo_description ??
    (body as { meta_description?: string | null }).meta_description ??
    undefined,
});

export const categoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategoriesAdmin: b.query<Category[], ListParams | void>({
      query: (params): FetchArgs => {
        const qp = toQueryParams(params as ListParams | undefined);
        // exactOptionalPropertyTypes uyumu: boşsa params hiç eklenmesin
        return qp ? { url: `${BASE}`, params: qp } : { url: `${BASE}` };
      },
      transformResponse: (res: unknown): Category[] =>
        Array.isArray(res) ? (res as ApiCategory[]).map(normalizeCategory) : [],
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
        } catch {
          /* no-op */
        }
      },
    }),

    updateCategoryAdmin: b.mutation<Category, { id: string; body: UpsertCategoryBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${id}`,
        method: "PUT",
        body: withCompat(body),
      }),
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

            if (body.image_url !== undefined) it.image_url = body.image_url ?? null;
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
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
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
            draft.sort(
              (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name),
            );
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleActiveCategoryAdmin: b.mutation<Category, { id: string; is_active: boolean }>({
      query: ({ id, is_active }): FetchArgs => ({
        url: `${BASE}/${id}/active`,
        method: "PATCH",
        body: { is_active },
      }),
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
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleFeaturedCategoryAdmin: b.mutation<Category, { id: string; is_featured: boolean }>({
      query: ({ id, is_featured }): FetchArgs => ({
        url: `${BASE}/${id}/featured`,
        method: "PATCH",
        body: { is_featured },
      }),
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
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
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
