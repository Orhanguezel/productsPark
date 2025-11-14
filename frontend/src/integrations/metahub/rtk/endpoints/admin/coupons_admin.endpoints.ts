// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints.ts
// ----------------------------------------------------------------------

import { baseApi } from "../../baseApi";
import type {
  Coupon,
  ApiCoupon,
  DiscountType,
  CreateCouponBody,
  UpdateCouponBody,
} from "../../../db/types/coupon";

const toNum = (x: unknown): number =>
  (typeof x === "number" ? x : Number(x)) || 0;

const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = x instanceof Date ? x : new Date(String(x));
  return Number.isFinite(d.valueOf()) ? d.toISOString() : null;
};

const parseArr = (x: unknown): string[] | null => {
  if (Array.isArray(x)) return x as string[];
  if (typeof x === "string") {
    try {
      const v = JSON.parse(x);
      return Array.isArray(v) ? (v as string[]) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const normType = (s?: string | null): DiscountType => {
  const v = String(s ?? "").toLowerCase();
  return v === "percentage" || v === "percent" ? "percentage" : "fixed";
};

const normalize = (c: ApiCoupon): Coupon => ({
  id: c.id,
  code: c.code,
  title: c.title ?? null,
  content_html: c.content_html ?? null,

  discount_type: normType(c.discount_type),
  discount_value: toNum(c.discount_value),

  min_purchase: c.min_purchase == null ? 0 : toNum(c.min_purchase),
  max_discount: c.max_discount == null ? null : toNum(c.max_discount),

  is_active: toBool(c.is_active),
  max_uses:
    (c.usage_limit ?? c.max_uses) == null
      ? null
      : toNum(c.usage_limit ?? c.max_uses),
  used_count: c.used_count == null ? null : toNum(c.used_count),

  valid_from: toIso(c.valid_from),
  valid_until: toIso(c.valid_until ?? c.valid_to),

  applicable_to: (c.applicable_to as Coupon["applicable_to"]) ?? "all",
  category_ids: parseArr(c.category_ids),
  product_ids: parseArr(c.product_ids),

  created_at: c.created_at ?? undefined,
  updated_at: c.updated_at ?? undefined,
});

export type CouponListParams = {
  is_active?: 0 | 1 | boolean;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
};

export const couponsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCouponsAdmin: b.query<Coupon[], CouponListParams | void>({
      query: (params) => ({
        url: "/admin/coupons",
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      transformResponse: (res: unknown): Coupon[] =>
        Array.isArray(res) ? (res as ApiCoupon[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({
                type: "Coupons" as const,
                id: c.id,
              })),
              { type: "Coupons" as const, id: "LIST" },
            ]
          : [{ type: "Coupons" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getCouponAdminById: b.query<Coupon, string>({
      query: (id) => ({ url: `/admin/coupons/${id}` }),
      transformResponse: (res: unknown): Coupon =>
        normalize(res as ApiCoupon),
      providesTags: (_r, _e, id) => [{ type: "Coupons", id }],
    }),

    createCouponAdmin: b.mutation<Coupon, CreateCouponBody>({
      query: (body) => ({
        url: "/admin/coupons",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Coupon =>
        normalize(res as ApiCoupon),
      invalidatesTags: [{ type: "Coupons", id: "LIST" }],
    }),

    updateCouponAdmin: b.mutation<
      Coupon,
      { id: string; body: UpdateCouponBody }
    >({
      query: ({ id, body }) => ({
        url: `/admin/coupons/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): Coupon =>
        normalize(res as ApiCoupon),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Coupons", id: arg.id },
        { type: "Coupons", id: "LIST" },
      ],
    }),

    toggleCouponAdmin: b.mutation<Coupon, { id: string; active: boolean }>(
      {
        query: ({ id, active }) => ({
          url: `/admin/coupons/${id}/${active ? "enable" : "disable"}`,
          method: "POST",
        }),
        transformResponse: (res: unknown): Coupon =>
          normalize(res as ApiCoupon),
        invalidatesTags: (_r, _e, arg) => [
          { type: "Coupons", id: arg.id },
          { type: "Coupons", id: "LIST" },
        ],
      },
    ),

    deleteCouponAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Coupons", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCouponsAdminQuery,
  useGetCouponAdminByIdQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
  useToggleCouponAdminMutation,
  useDeleteCouponAdminMutation,
} = couponsAdminApi;
