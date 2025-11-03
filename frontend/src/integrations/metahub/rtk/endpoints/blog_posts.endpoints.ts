// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/blog_posts.endpoints.ts
// =============================================================
import { baseApi as baseApi4 } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ApiBlogPost,
  BlogPost,
  ListParams,
} from "../../db/types/blog";

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

const normalize = (r: ApiBlogPost): BlogPost => {
  const title = toStr(r.title, "");
  const slug = toStr(r.slug, "");
  const content = toStr(r.content, "");
  return {
    id: String(r.id),
    title,
    slug,
    excerpt: toStr(r.excerpt, "") || null,
    content,
    author_name: toStr(r.author, "Admin"),

    // Yeni alanlar
    image_url: (r.featured_image ?? null) as string | null,
    image_asset_id: (r.featured_image_asset_id ?? null) as string | null,
    image_alt: (r.featured_image_alt ?? null) as string | null,

    created_at: toStr(r.created_at, ""),
    read_time: computeReadTime(content),
    is_published: toBool(r.is_published),
    published_at: (r.published_at as string | null) ?? null,
    updated_at: toStr(r.updated_at, ""),
  };
};

type QueryParams = Record<string, string | number | boolean | undefined>;

export const blogPostsApi = baseApi4.injectEndpoints({
  endpoints: (b) => ({
    listBlogPosts: b.query<BlogPost[], ListParams | undefined>({
      query: (params) => {
        const qp: QueryParams = {};
        if (params?.q) qp.q = params.q;
        if (typeof params?.limit === "number") qp.limit = params.limit;
        if (typeof params?.offset === "number") qp.offset = params.offset;
        if (params?.sort) qp.sort = params.sort;
        if (params?.order) qp.order = params.order;
        if (params?.is_published !== undefined) {
          qp.is_published =
            params.is_published === true
              ? 1
              : params.is_published === false
              ? 0
              : params.is_published;
        }
        return { url: "/blog_posts", params: qp } as FetchArgs;
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
      query: (slug) =>
        ({ url: `/blog_posts/by-slug/${encodeURIComponent(slug)}` } as FetchArgs),
      transformResponse: (res: unknown): BlogPost | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? (res as ApiBlogPost[])[0] : (res as ApiBlogPost);
        return row ? normalize(row) : null;
      },
      providesTags: (_r, _e, slug) => [{ type: "BlogPost", id: `SLUG_${slug}` }],
    }),

    getBlogPostById: b.query<BlogPost, string>({
      query: (id) => ({ url: `/blog_posts/${id}` } as FetchArgs),
      transformResponse: (res: unknown): BlogPost => normalize(res as ApiBlogPost),
      providesTags: (_r, _e, id) => [{ type: "BlogPost", id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBlogPostsQuery,
  useGetBlogPostBySlugQuery,
  useGetBlogPostByIdQuery,
} = blogPostsApi;
