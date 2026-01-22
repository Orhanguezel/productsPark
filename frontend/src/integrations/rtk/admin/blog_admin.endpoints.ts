// =============================================================
// FILE: src/integrations/rtk/admin/blog_admin.endpoints.ts
// FINAL — Blog Admin RTK (central types+normalizers)
// - tags unified: BlogPosts
// - exactOptionalPropertyTypes friendly
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { BlogPost, BlogListParams, UpsertBlogBody } from '@/integrations/types';
import {
  normalizeBlogPost,
  normalizeBlogPostList,
  toBlogListQuery,
  toBlogUpsertApiBody,
} from '@/integrations/types';

const BASE = '/admin/blog_posts';
const PUBLIC_BASE = '/blog_posts';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['BlogPosts'] as const,
});

export const blogAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listBlogPostsAdmin: b.query<BlogPost[], BlogListParams | void>({
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

    getBlogPostAdminById: b.query<BlogPost, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res),
      providesTags: (_r, _e, id) => [{ type: 'BlogPosts' as const, id }],
    }),

    getBlogPostAdminBySlug: b.query<BlogPost | null, string>({
      query: (slug) => ({
        url: `${PUBLIC_BASE}/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): BlogPost | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? res[0] : res;
        return row ? normalizeBlogPost(row) : null;
      },
      providesTags: (_r, _e, slug) => [{ type: 'BlogPosts' as const, id: `SLUG_${slug}` }],
    }),

    createBlogPostAdmin: b.mutation<BlogPost, UpsertBlogBody>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body: toBlogUpsertApiBody(body),
      }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res),
      invalidatesTags: [{ type: 'BlogPosts' as const, id: 'LIST' }],
    }),

    updateBlogPostAdmin: b.mutation<BlogPost, { id: string; body: UpsertBlogBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PUT',
        body: toBlogUpsertApiBody(body),
      }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'BlogPosts' as const, id: arg.id },
        { type: 'BlogPosts' as const, id: 'LIST' },
      ],
    }),

    deleteBlogPostAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'BlogPosts' as const, id },
        { type: 'BlogPosts' as const, id: 'LIST' },
      ],
    }),

    reorderBlogPostsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body: { items },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'BlogPosts' as const, id: 'LIST' }],
    }),

    togglePublishBlogPostAdmin: b.mutation<BlogPost, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/publish`,
        method: 'PATCH',
        body: { is_published },
      }),
      transformResponse: (res: unknown): BlogPost => normalizeBlogPost(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'BlogPosts' as const, id: arg.id },
        { type: 'BlogPosts' as const, id: 'LIST' },
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
