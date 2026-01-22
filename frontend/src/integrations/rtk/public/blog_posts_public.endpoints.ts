// =============================================================
// FILE: src/integrations/rtk/public/blog_posts_public.endpoints.ts
// FINAL — Blog Posts Public RTK (central types+normalizers)
// - tags unified: BlogPosts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { BlogPost, BlogListParams } from '@/integrations/types';
import { normalizeBlogPost, normalizeBlogPostList, toBlogListQuery } from '@/integrations/types';

const BASE = '/blog_posts';

export const blogPostsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBlogPosts: b.query<BlogPost[], BlogListParams | void>({
      query: (params) => {
        const qs = toBlogListQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): BlogPost[] => normalizeBlogPostList(res),
      providesTags: (result) =>
        result?.length
          ? [
              { type: 'BlogPosts' as const, id: 'LIST' },
              ...result.map((p) => ({ type: 'BlogPosts' as const, id: p.id })),
            ]
          : [{ type: 'BlogPosts' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getBlogPostBySlug: b.query<BlogPost | null, string>({
      query: (slug) => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}`, method: 'GET' }),
      transformResponse: (res: unknown): BlogPost | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? res[0] : res;
        return row ? normalizeBlogPost(row) : null;
      },
      providesTags: (_r, _e, slug) => [{ type: 'BlogPosts' as const, id: `SLUG_${slug}` }],
    }),

    getBlogPostById: b.query<BlogPost, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res),
      providesTags: (_r, _e, id) => [{ type: 'BlogPosts' as const, id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListBlogPostsQuery, useGetBlogPostBySlugQuery, useGetBlogPostByIdQuery } =
  blogPostsApi;
