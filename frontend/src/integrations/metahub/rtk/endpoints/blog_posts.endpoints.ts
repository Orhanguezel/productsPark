// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/blog_posts.endpoints.ts
// =============================================================
import { baseApi as baseApi4 } from "../baseApi";

/** helpers */
const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";
const toStr = (x: unknown, fallback = ""): string =>
  typeof x === "string" ? x : fallback;
const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, " ");
const computeReadTime = (html: string): string => {
  const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} dk`;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  created_at: string;
  image_url: string;
  read_time: string;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string | null;
  updated_at?: string;
};

export type ApiBlogPost = {
  id: string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  author?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  category?: string | null;
  is_featured?: boolean | 0 | 1 | "0" | "1";
};

const normalize = (r: ApiBlogPost): BlogPost => {
  const title = toStr(r.title, "");
  const slug = toStr(r.slug, "");
  const content = toStr(r.content, "");
  return {
    id: r.id,
    title,
    slug,
    excerpt: toStr(r.excerpt, ""),
    content,
    category: toStr(r.category, "Genel"),
    author_name: toStr(r.author, "Admin"),
    created_at: toStr(r.created_at, ""),
    image_url: toStr(r.featured_image, ""),
    read_time: computeReadTime(content),
    is_published: toBool(r.is_published),
    is_featured: toBool(r.is_featured),
    published_at: r.published_at ?? null,
    updated_at: r.updated_at,
  };
};

// ✅ Parametre tipi + params object fix
type ListParams = {
  is_published?: 0 | 1 | boolean;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
};
type QueryParams = Record<string, string | number | boolean | undefined>;

export const blogPostsApi = baseApi4.injectEndpoints({
  endpoints: (b) => ({
    // void yerine undefined kullandık; params her zaman obje olarak veriliyor
    listBlogPosts: b.query<BlogPost[], ListParams | undefined>({
      query: (params) => {
        const qp: QueryParams = { ...(params ?? {}) };
        return { url: "/blog_posts", params: qp };
      },
      transformResponse: (res: unknown): BlogPost[] =>
        Array.isArray(res) ? (res as ApiBlogPost[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "BlogPost" as const, id: p.id })),
              { type: "BlogPosts" as const, id: "LIST" },
            ]
          : [{ type: "BlogPosts" as const, id: "LIST" }],
    }),

    getBlogPostBySlug: b.query<BlogPost | null, string>({
      query: (slug) => ({ url: `/blog_posts/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): BlogPost | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? (res as ApiBlogPost[])[0] : (res as ApiBlogPost);
        return row ? normalize(row) : null;
      },
      providesTags: (_r, _e, slug) => [{ type: "BlogPost", id: `SLUG_${slug}` }],
    }),

    getBlogPostById: b.query<BlogPost, string>({
      query: (id) => ({ url: `/blog_posts/${id}` }),
      transformResponse: (res: unknown): BlogPost => normalize(res as ApiBlogPost),
      providesTags: (_r, _e, id) => [{ type: "BlogPost", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListBlogPostsQuery, useGetBlogPostBySlugQuery, useGetBlogPostByIdQuery } = blogPostsApi;
