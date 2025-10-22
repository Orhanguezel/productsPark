
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/reviews_admin.endpoints.ts
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

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number; // 1..5
  title: string | null;
  content: string;
  status: ReviewStatus;
  is_visible: boolean;
  is_pinned: boolean;
  helpful_count: number;
  // Joins (optional)
  user?: { id: string; name: string | null; avatar_url: string | null } | null;
  product?: { id: string; name: string; slug: string } | null;
  created_at: string;
  updated_at?: string | null;
};

export type ApiReview = Omit<Review,
  | "rating" | "helpful_count"
  | "is_visible" | "is_pinned"
> & {
  rating: number | string;
  helpful_count: number | string;
  is_visible: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_pinned: boolean | 0 | 1 | "0" | "1" | "true" | "false";
};

const normalizeReview = (r: ApiReview): Review => ({
  ...r,
  title: (r.title ?? null) as string | null,
  user_id: (r.user_id ?? null) as string | null,
  user: r.user ? { id: r.user.id, name: r.user.name ?? null, avatar_url: r.user.avatar_url ?? null } : null,
  product: r.product ? { id: r.product.id, name: r.product.name, slug: r.product.slug } : null,
  rating: toNumber(r.rating),
  helpful_count: toNumber(r.helpful_count),
  is_visible: toBool(r.is_visible),
  is_pinned: toBool(r.is_pinned),
  updated_at: (r.updated_at ?? null) as string | null,
});

export type ListParams = {
  q?: string; // search in title/content
  product_id?: string;
  user_id?: string;
  status?: ReviewStatus;
  is_visible?: boolean;
  is_pinned?: boolean;
  min_rating?: number;
  max_rating?: number;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "rating" | "helpful_count" | "updated_at";
  order?: "asc" | "desc";
  // include joins
  include?: Array<"user" | "product">;
};

export type ReplyBody = { message: string };

export const reviewsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listReviewsAdmin: b.query<Review[], ListParams | void>({
      query: (params) => ({ url: "/reviews", params }),
      transformResponse: (res: unknown): Review[] => Array.isArray(res) ? (res as ApiReview[]).map(normalizeReview) : [],
      providesTags: (result) => result ? [
        ...result.map((r) => ({ type: "Reviews" as const, id: r.id })),
        { type: "Reviews" as const, id: "LIST" },
      ] : [{ type: "Reviews" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getReviewAdminById: b.query<Review, string>({
      query: (id) => ({ url: `/reviews/${id}` }),
      transformResponse: (res: unknown): Review => normalizeReview(res as ApiReview),
      providesTags: (_r, _e, id) => [{ type: "Reviews", id }],
    }),

    approveReviewAdmin: b.mutation<Review, string>({
      query: (id) => ({ url: `/reviews/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: unknown): Review => normalizeReview(res as ApiReview),
      invalidatesTags: (_r, _e, id) => [{ type: "Reviews", id }, { type: "Reviews", id: "LIST" }],
    }),

    rejectReviewAdmin: b.mutation<Review, { id: string; reason?: string | null }>({
      query: ({ id, reason }) => ({ url: `/reviews/${id}/reject`, method: "PATCH", body: { reason } }),
      transformResponse: (res: unknown): Review => normalizeReview(res as ApiReview),
      invalidatesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.id }, { type: "Reviews", id: "LIST" }],
    }),

    toggleVisibleReviewAdmin: b.mutation<Review, { id: string; is_visible: boolean }>({
      query: ({ id, is_visible }) => ({ url: `/reviews/${id}/visible`, method: "PATCH", body: { is_visible } }),
      transformResponse: (res: unknown): Review => normalizeReview(res as ApiReview),
      invalidatesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.id }, { type: "Reviews", id: "LIST" }],
    }),

    togglePinnedReviewAdmin: b.mutation<Review, { id: string; is_pinned: boolean }>({
      query: ({ id, is_pinned }) => ({ url: `/reviews/${id}/pinned`, method: "PATCH", body: { is_pinned } }),
      transformResponse: (res: unknown): Review => normalizeReview(res as ApiReview),
      invalidatesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.id }, { type: "Reviews", id: "LIST" }],
    }),

    deleteReviewAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [{ type: "Reviews", id }, { type: "Reviews", id: "LIST" }],
    }),

    replyReviewAdmin: b.mutation<{ ok: true }, { id: string; body: ReplyBody }>({
      query: ({ id, body }) => ({ url: `/reviews/${id}/reply`, method: "POST", body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListReviewsAdminQuery,
  useGetReviewAdminByIdQuery,
  useApproveReviewAdminMutation,
  useRejectReviewAdminMutation,
  useToggleVisibleReviewAdminMutation,
  useTogglePinnedReviewAdminMutation,
  useDeleteReviewAdminMutation,
  useReplyReviewAdminMutation,
} = reviewsAdminApi;
