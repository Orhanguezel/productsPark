import { baseApi } from "../baseApi";
import type { Coupon, ApiCoupon } from "../../db/types/coupon";

// helpers (typed)
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x)) || 0;
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
    try { const v = JSON.parse(x); return Array.isArray(v) ? (v as string[]) : null; } catch { return null; }
  }
  return null;
};
const normType = (s?: string | null): "percentage" | "fixed" => {
  const v = String(s ?? "").toLowerCase();
  return v === "percentage" || v === "percent" ? "percentage" : "fixed";
};

const normalize = (c: ApiCoupon): Coupon => ({
  id: c.id,
  code: c.code,
  title: c.title ?? null,
  discount_type: normType(c.discount_type),
  discount_value: toNum(c.discount_value),
  min_purchase: c.min_purchase == null ? 0 : toNum(c.min_purchase),
  max_discount: c.max_discount == null ? null : toNum(c.max_discount),
  is_active: toBool(c.is_active),
  max_uses: (c.usage_limit ?? c.max_uses) == null ? null : toNum(c.usage_limit ?? c.max_uses),
  used_count: c.used_count == null ? null : toNum(c.used_count),
  valid_from: toIso(c.valid_from),
  valid_until: toIso(c.valid_until ?? c.valid_to),
  applicable_to: (c.applicable_to as Coupon["applicable_to"]) ?? "all",
  category_ids: parseArr(c.category_ids),
  product_ids: parseArr(c.product_ids),
  created_at: c.created_at,
  updated_at: c.updated_at,
});

export type PublicCouponListParams = {
  is_active?: 0 | 1 | boolean;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
};

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCoupons: b.query<
      Coupon[],
      PublicCouponListParams | void
    >({
      query: (params) => ({
        url: "/coupons",
        // 🔧 void | {...} → undefined | Record<string, unknown>
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      transformResponse: (res: unknown): Coupon[] =>
        Array.isArray(res) ? (res as ApiCoupon[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: "Coupon" as const, id: c.id })), { type: "Coupon" as const, id: "LIST" }]
          : [{ type: "Coupon" as const, id: "LIST" }],
    }),

    getCouponById: b.query<Coupon, string>({
      query: (id) => ({ url: `/coupons/${id}` }),
      transformResponse: (res: unknown): Coupon => normalize(res as ApiCoupon),
      providesTags: (_r, _e, id) => [{ type: "Coupon", id }],
    }),

    getCouponByCode: b.query<Coupon | null, string>({
      query: (code) => ({ url: `/coupons/by-code/${encodeURIComponent(code)}` }),
      transformResponse: (res: unknown): Coupon | null => {
        if (!res) return null;
        const r = Array.isArray(res) ? (res as ApiCoupon[])[0] : (res as ApiCoupon);
        return r ? normalize(r) : null;
      },
      providesTags: (_r, _e, code) => [{ type: "Coupon", id: `CODE_${code}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCouponsQuery,
  useGetCouponByIdQuery,
  useGetCouponByCodeQuery,
} = couponsApi;
