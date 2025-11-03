// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ApiBlogPost,
  BlogPost,
  ListParams,
  UpsertBlogBody,
} from "../../../db/types/blog";

// ---------- helpers ----------
const toNumber = (x: unknown): number => {
  if (typeof x === "number") return x;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : 0;
};

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
  // BE şemasında category yok → gönderme
  if (params.is_published !== undefined) {
    qp.is_published =
      params.is_published === true
        ? 1
        : params.is_published === false
        ? 0
        : params.is_published;
  }
  if (typeof params.limit === "number") qp.limit = params.limit;
  if (typeof params.offset === "number") qp.offset = params.offset;
  if (params.sort) qp.sort = params.sort;
  if (params.order) qp.order = params.order;
  return qp;
};

const normalizeBlogPost = (p: ApiBlogPost): BlogPost => ({
  id: String(p.id),
  title: String(p.title ?? ""),
  slug: String(p.slug ?? ""),
  excerpt: (p.excerpt ?? null) as string | null,
  content: (p.content ?? null) as string | null,

  // Yeni alanlar
  image_url: (p.featured_image ?? null) as string | null,
  image_asset_id: (p.featured_image_asset_id ?? null) as string | null,
  image_alt: (p.featured_image_alt ?? null) as string | null,

  author_name: (p.author ?? null) as string | null,

  is_published: toBool(p.is_published),
  created_at: String(p.created_at ?? ""),
  updated_at: String(p.updated_at ?? ""),
  published_at: (p.published_at as string | null) ?? null,
});

// FE -> BE body map
const toApiBody = (b: UpsertBlogBody) => ({
  title: b.title,
  slug: b.slug,
  excerpt: b.excerpt ?? null,
  content: b.content ?? null,

  // map: FE -> BE
  featured_image: b.image_url ?? null,
  featured_image_asset_id: b.image_asset_id ?? null,
  featured_image_alt: b.image_alt ?? null,

  author: b.author_name ?? null,
  is_published: b.is_published ?? false,
});

const BASE = "/admin/blog_posts";

// ---------- api ----------
export const blogAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBlogPostsAdmin: b.query<BlogPost[], ListParams | undefined>({
      query: (params) =>
        ({ url: `${BASE}`, params: toQueryParams(params) } as FetchArgs),
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
      query: (id) => ({ url: `${BASE}/${id}` } as FetchArgs),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      providesTags: (_r, _e, id) => [{ type: "BlogPosts", id }],
    }),

    getBlogPostAdminBySlug: b.query<BlogPost | null, string>({
      query: (slug) =>
        ({ url: `/blog_posts/by-slug/${encodeURIComponent(slug)}` } as FetchArgs),
      transformResponse: (res: unknown): BlogPost | null =>
        res ? normalizeBlogPost(res as ApiBlogPost) : null,
      providesTags: (_r, _e, slug) => [{ type: "BlogPosts", id: `SLUG_${slug}` }],
    }),

    createBlogPostAdmin: b.mutation<BlogPost, UpsertBlogBody>({
      query: (body) =>
        ({ url: `${BASE}`, method: "POST", body: toApiBody(body) } as FetchArgs),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    // PUT: full update
    updateBlogPostAdmin: b.mutation<BlogPost, { id: string; body: UpsertBlogBody }>({
      query: ({ id, body }) =>
        ({ url: `${BASE}/${id}`, method: "PUT", body: toApiBody(body) } as FetchArgs),
      transformResponse: (res: unknown): BlogPost =>
        normalizeBlogPost(res as ApiBlogPost),
      invalidatesTags: (_r, _e, arg) => [
        { type: "BlogPosts", id: arg.id },
        { type: "BlogPosts", id: "LIST" },
      ],
    }),

    deleteBlogPostAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "BlogPosts", id },
        { type: "BlogPosts", id: "LIST" },
      ],
    }),

    reorderBlogPostsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) =>
        ({ url: `${BASE}/reorder`, method: "POST", body: { items } } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "BlogPosts", id: "LIST" }],
    }),

    togglePublishBlogPostAdmin: b.mutation<BlogPost, { id: string; is_published: boolean }>({
      query: ({ id, is_published }) =>
        ({
          url: `${BASE}/${id}/publish`,
          method: "PATCH",
          body: { is_published },
        } as FetchArgs),
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
