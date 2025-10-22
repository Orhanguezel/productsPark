
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/blog_admin.endpoints.ts
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
const tryParse = <T = unknown>(x: unknown): T => {
  if (typeof x === "string") {
    const s = x.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try { return JSON.parse(s) as T; } catch { /* ignore */ }
    }
  }
  return x as T;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null; // HTML/MD
  image_url: string | null;
  category: string | null; // simple string category for now
  read_time: string | null; // e.g., "5 dk"
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  display_order: number;
};

export type ApiBlogPost = Omit<BlogPost,
  | "is_published" | "display_order"
> & {
  is_published: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order: number | string;
};

const normalizeBlogPost = (p: ApiBlogPost): BlogPost => ({
  ...p,
  excerpt: (p.excerpt ?? null) as string | null,
  content: (p.content ?? null) as string | null,
  image_url: (p.image_url ?? null) as string | null,
  category: (p.category ?? null) as string | null,
  read_time: (p.read_time ?? null) as string | null,
  is_published: toBool(p.is_published),
  display_order: toNumber(p.display_order),
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
  content?: string | null; // HTML/MD
  image_url?: string | null;
  category?: string | null;
  read_time?: string | null;
  is_published?: boolean;
  display_order?: number;
};

export const blogAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBlogPostsAdmin: b.query<BlogPost[], ListParams | void>({
      query: (params) => ({ url: "/blog_posts", params }),
      transformResponse: (res: unknown): BlogPost[] => Array.isArray(res) ? (res as ApiBlogPost[]).map(normalizeBlogPost) : [],
      providesTags: (result) => result ? [
        ...result.map((p) => ({ type: "BlogPosts" as const, id: p.id })),
        { type: "BlogPosts" as const, id: "LIST" },
      ] : [{ type: "BlogPosts" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getBlogPostAdminById: b.query<BlogPost, string>({
      query: (id) => ({ url: `/blog_posts/${id}` }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res as ApiBlogPost),
      providesTags: (_r, _e, id) => [{ type: "BlogPosts", id }],
    }),

    getBlogPostAdminBySlug: b.query<BlogPost | null, string>({
      query: (slug) => ({ url: `/blog_posts/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): BlogPost | null => res ? normalizeBlogPost(res as ApiBlogPost) : null,
      providesTags: (_r, _e, slug) => [{ type: "BlogPosts", id: `SLUG_${slug}` }],
    }),

    createBlogPostAdmin: b.mutation<BlogPost, UpsertBlogBody>({
      query: (body) => ({ url: "/blog_posts", method: "POST", body }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    updateBlogPostAdmin: b.mutation<BlogPost, { id: string; body: UpsertBlogBody }>({
      query: ({ id, body }) => ({ url: `/blog_posts/${id}`, method: "PUT", body }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: (_r, _e, arg) => [{ type: "BlogPosts", id: arg.id }, { type: "BlogPosts", id: "LIST" }],
    }),

    deleteBlogPostAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/blog_posts/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [{ type: "BlogPosts", id }, { type: "BlogPosts", id: "LIST" }],
    }),

    reorderBlogPostsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: "/blog_posts/reorder", method: "POST", body: { items } }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    togglePublishBlogPostAdmin: b.mutation<BlogPost, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({ url: `/blog_posts/${id}/publish`, method: "PATCH", body: { is_published } }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: (_r, _e, arg) => [{ type: "BlogPosts", id: arg.id }, { type: "BlogPosts", id: "LIST" }],
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