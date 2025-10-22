
// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/blog_posts.endpoints.ts
// =============================================================
import { baseApi as baseApi4 } from "../baseApi";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null; // HTML
  category?: string | null;
  author_name?: string | null;
  cover_image_url?: string | null;
  read_time?: number | null;
  is_published?: 0 | 1 | boolean;
  is_featured?: 0 | 1 | boolean;
  created_at: string;
  updated_at?: string;
};

export const blogPostsApi = baseApi4.injectEndpoints({
  endpoints: (b) => ({
    listBlogPosts: b.query<
      BlogPost[],
      { is_published?: 0 | 1 | boolean; limit?: number; offset?: number; sort?: "created_at" | "updated_at"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/blog_posts", params }),
      transformResponse: (res: unknown): BlogPost[] => Array.isArray(res) ? (res as BlogPost[]) : [],
      providesTags: (result) => result
        ? [...result.map((p) => ({ type: "BlogPost" as const, id: p.id })), { type: "BlogPosts" as const, id: "LIST" }]
        : [{ type: "BlogPosts" as const, id: "LIST" }],
    }),

    getBlogPostBySlug: b.query<BlogPost, string>({
      query: (slug) => ({ url: `/blog_posts/by-slug/${slug}` }),
      transformResponse: (res: unknown): BlogPost => res as BlogPost,
      providesTags: (_r, _e, slug) => [{ type: "BlogPost", id: `SLUG_${slug}` }],
    }),

    getBlogPostById: b.query<BlogPost, string>({
      query: (id) => ({ url: `/blog_posts/${id}` }),
      transformResponse: (res: unknown): BlogPost => res as BlogPost,
      providesTags: (_r, _e, id) => [{ type: "BlogPost", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListBlogPostsQuery, useGetBlogPostBySlugQuery, useGetBlogPostByIdQuery } = blogPostsApi;
