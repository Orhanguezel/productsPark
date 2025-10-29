// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// ---------- helpers ----------
const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x as unknown);

const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};

type QueryParams = Record<string, string | number | boolean | undefined>;
const toQueryParams = (params?: ListParams): QueryParams => {
  if (!params) return {};
  const qp: QueryParams = {};
  if (params.q) qp.q = params.q;
  if (params.category) qp.category = params.category;
  if (params.is_published !== undefined) {
    qp.is_published =
      params.is_published === true ? 1 :
      params.is_published === false ? 0 : params.is_published;
  }
  if (typeof params.limit === "number") qp.limit = params.limit;
  if (typeof params.offset === "number") qp.offset = params.offset;
  if (params.sort) qp.sort = params.sort;
  if (params.order) qp.order = params.order;
  return qp;
};

// ---------- types (ADMIN) ----------
export type ApiBlogPost = {
  id: string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  author?: string | null;
  category?: string | null;
  read_time?: string | null;
  is_published?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_featured?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order?: number | string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;     // featured_image -> image_url
  author_name: string | null;   // author -> author_name
  category: string | null;
  read_time: string | null;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
};

const normalizeBlogPost = (p: ApiBlogPost): BlogPost => ({
  id: p.id,
  title: String(p.title ?? ""),
  slug: String(p.slug ?? ""),
  excerpt: (p.excerpt ?? null) as string | null,
  content: (p.content ?? null) as string | null,
  image_url: (p.featured_image ?? null) as string | null,
  author_name: (p.author ?? null) as string | null,
  category: (p.category ?? null) as string | null,
  read_time: (p.read_time ?? null) as string | null,
  is_published: toBool(p.is_published),
  is_featured: toBool(p.is_featured),
  display_order: toNumber(p.display_order ?? 0),
  created_at: p.created_at,
  updated_at: p.updated_at,
  published_at: p.published_at ?? null,
});

export type ListParams = {
  q?: string;
  category?: string;
  is_published?: boolean;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "display_order" | "title";
  order?: "asc" | "desc";
};

export type UpsertBlogBody = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;     // FE alan adı
  author_name?: string | null;   // FE alan adı
  category?: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
};

// FE -> BE body map (author_name -> author, image_url -> featured_image)
const toApiBody = (b: UpsertBlogBody) => ({
  title: b.title,
  slug: b.slug,
  excerpt: b.excerpt ?? null,
  content: b.content ?? null,
  category: b.category ?? null,
  author: b.author_name ?? null,
  featured_image: b.image_url ?? null,
  is_published: b.is_published ?? false,
  is_featured: b.is_featured ?? false,
  display_order: b.display_order ?? 0,
});

const BASE = "/admin/blog_posts";

// ---------- api ----------
export const blogAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBlogPostsAdmin: b.query<BlogPost[], ListParams | undefined>({
      query: (params) => ({ url: `${BASE}`, params: toQueryParams(params) }),
      transformResponse: (res: unknown): BlogPost[] =>
        Array.isArray(res) ? (res as ApiBlogPost[]).map(normalizeBlogPost) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "BlogPosts" as const, id: p.id })),
              { type: "BlogPosts" as const, id: "LIST" },
            ]
          : [{ type: "BlogPosts" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getBlogPostAdminById: b.query<BlogPost, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      providesTags: (_r, _e, id) => [{ type: "BlogPosts", id }],
    }),

    getBlogPostAdminBySlug: b.query<BlogPost | null, string>({
      query: (slug) => ({ url: `/blog_posts/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): BlogPost | null =>
        res ? normalizeBlogPost(res as ApiBlogPost) : null,
      providesTags: (_r, _e, slug) => [{ type: "BlogPosts", id: `SLUG_${slug}` }],
    }),

    createBlogPostAdmin: b.mutation<BlogPost, UpsertBlogBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    // 🔴 GÜNCELLEME: PUT
    updateBlogPostAdmin: b.mutation<BlogPost, { id: string; body: UpsertBlogBody }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PUT", body: toApiBody(body) }),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: (_r, _e, arg) => [
        { type: "BlogPosts", id: arg.id },
        { type: "BlogPosts", id: "LIST" },
      ],
    }),

    deleteBlogPostAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "BlogPosts", id },
        { type: "BlogPosts", id: "LIST" },
      ],
    }),

    reorderBlogPostsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: `${BASE}/reorder`, method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    togglePublishBlogPostAdmin: b.mutation<BlogPost, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({
        url: `${BASE}/${id}/publish`,
        method: "PATCH",
        body: { is_published },
      }),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: (_r, _e, arg) => [
        { type: "BlogPosts", id: arg.id },
        { type: "BlogPosts", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBlogPostsAdminQuery,
  useGetBlogPostAdminByIdQuery,
  useGetBlogPostAdminBySlugQuery,
  useCreateBlogPostAdminMutation,
  useUpdateBlogPostAdminMutation,
  useDeleteBlogPostAdminMutation,
  useReorderBlogPostsAdminMutation,
  useTogglePublishBlogPostAdminMutation,
} = blogAdminApi;
