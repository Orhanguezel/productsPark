
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/categories_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  // SEO
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiCategory = Omit<Category, "is_active" | "is_featured" | "display_order"> & {
  is_active: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_featured: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order: number | string;
};

const normalizeCategory = (c: ApiCategory): Category => ({
  ...c,
  description: (c.description ?? null) as string | null,
  image_url: (c.image_url ?? null) as string | null,
  icon: (c.icon ?? null) as string | null,
  parent_id: (c.parent_id ?? null) as string | null,
  seo_title: (c.seo_title ?? null) as string | null,
  seo_description: (c.seo_description ?? null) as string | null,
  is_active: toBool(c.is_active),
  is_featured: toBool(c.is_featured),
  display_order: toNumber(c.display_order),
});

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

export type UpsertCategoryBody = {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
};

export const categoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCategoriesAdmin: b.query<Category[], ListParams | void>({
      query: (params) => ({ url: "/categories", params }),
      transformResponse: (res: unknown): Category[] => Array.isArray(res) ? (res as ApiCategory[]).map(normalizeCategory) : [],
      providesTags: (result) => result ? [
        ...result.map((c) => ({ type: "Categories" as const, id: c.id })),
        { type: "Categories" as const, id: "LIST" },
      ] : [{ type: "Categories" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getCategoryAdminById: b.query<Category, string>({
      query: (id) => ({ url: `/categories/${id}` }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),

    getCategoryAdminBySlug: b.query<Category | null, string>({
      query: (slug) => ({ url: `/categories/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Category | null => res ? normalizeCategory(res as ApiCategory) : null,
      providesTags: (_r, _e, slug) => [{ type: "Categories", id: `SLUG_${slug}` }],
    }),

    createCategoryAdmin: b.mutation<Category, UpsertCategoryBody>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    updateCategoryAdmin: b.mutation<Category, { id: string; body: UpsertCategoryBody }>({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: "PUT", body }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [{ type: "Categories", id: arg.id }, { type: "Categories", id: "LIST" }],
    }),

    deleteCategoryAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [{ type: "Categories", id }, { type: "Categories", id: "LIST" }],
    }),

    reorderCategoriesAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: "/categories/reorder", method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),

    toggleActiveCategoryAdmin: b.mutation<Category, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({ url: `/categories/${id}/active`, method: "PATCH", body: { is_active } }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [{ type: "Categories", id: arg.id }, { type: "Categories", id: "LIST" }],
    }),

    toggleFeaturedCategoryAdmin: b.mutation<Category, { id: string; is_featured: boolean }>({
      query: ({ id, is_featured }) => ({ url: `/categories/${id}/featured`, method: "PATCH", body: { is_featured } }),
      transformResponse: (res: unknown): Category => normalizeCategory(res as ApiCategory),
      invalidatesTags: (_r, _e, arg) => [{ type: "Categories", id: arg.id }, { type: "Categories", id: "LIST" }],
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
