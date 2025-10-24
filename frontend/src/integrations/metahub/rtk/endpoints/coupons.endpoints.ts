// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/coupons.endpoints.ts
// =============================================================
import { baseApi as baseApi3 } from "../baseApi";

/** helpers (no-explicit-any yok) */
const toFiniteNumber = (x: unknown): number => {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

const toDate = (input: unknown): Date | null => {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};
const toIso = (x: unknown): string | null => {
  const d = toDate(x);
  return d ? d.toISOString() : null;
};

const tryParseArr = <T>(x: unknown): T[] | null => {
  if (x == null) return null;
  if (typeof x === "string") {
    try { return JSON.parse(x) as T[]; } catch { /* noop */ }
  }
  return Array.isArray(x) ? (x as T[]) : null;
};

/** UI/FE’nin beklediği tipler */
export type DiscountType = "percentage" | "fixed";
export type Coupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase: number;         // (min_order_total/min_purchase)
  max_discount?: number | null;

  is_active: boolean;
  max_uses?: number | null;
  used_count?: number | null;

  valid_from?: string | null;
  valid_until?: string | null;

  applicable_to?: "all" | "category" | "product";
  category_ids?: string[] | null;
  product_ids?: string[] | null;

  created_at?: string;
  updated_at?: string;
};

/** Backend’ten gelebilecek ham şekiller */
export type ApiCoupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type?: string | null;          // percent/amount | percentage/fixed
  discount_value?: number | string;

  min_order_total?: number | string | null;
  min_purchase?: number | string | null;
  max_discount?: number | string | null;

  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  max_uses?: number | string | null;
  used_count?: number | string | null;

  valid_from?: string | Date | null;
  valid_to?: string | Date | null;        // eski isim
  valid_until?: string | Date | null;     // yeni isim

  applicable_to?: "all" | "category" | "product" | string | null;
  category_ids?: string | string[] | null;
  product_ids?: string | string[] | null;

  created_at?: string;
  updated_at?: string;
};

const normalizeDiscountType = (x?: string | null): DiscountType => {
  const s = String(x ?? "").toLowerCase();
  if (s === "percentage" || s === "percent") return "percentage";
  if (s === "fixed" || s === "amount") return "fixed";
  return "fixed";
};

const normalizeCoupon = (c: ApiCoupon): Coupon => ({
  id: c.id,
  code: c.code,
  title: c.title ?? null,

  discount_type: normalizeDiscountType(c.discount_type),
  discount_value: toFiniteNumber(c.discount_value),

  min_purchase:
    c.min_purchase != null ? toFiniteNumber(c.min_purchase) :
    c.min_order_total != null ? toFiniteNumber(c.min_order_total) :
    0,

  max_discount: c.max_discount == null ? null : toFiniteNumber(c.max_discount),

  is_active: toBool(c.is_active),
  max_uses: c.max_uses == null ? null : toFiniteNumber(c.max_uses),
  used_count: c.used_count == null ? null : toFiniteNumber(c.used_count),

  valid_from: toIso(c.valid_from),
  valid_until: toIso(c.valid_until ?? c.valid_to),

  applicable_to: (c.applicable_to as Coupon["applicable_to"]) ?? "all",
  category_ids: tryParseArr<string>(c.category_ids),
  product_ids: tryParseArr<string>(c.product_ids),

  created_at: c.created_at,
  updated_at: c.updated_at,
});

export const couponsApi = baseApi3.injectEndpoints({
  endpoints: (b) => ({
    listCoupons: b.query<
      Coupon[],
      | void
      | {
          is_active?: 0 | 1 | boolean;
          q?: string;
          limit?: number;
          offset?: number;
          sort?: "created_at" | "updated_at";
          order?: "asc" | "desc";
        }
    >({
      query: (params) => ({
        url: "/coupons",
        params: (params ?? {}) as Record<string, unknown>,
      }),
      transformResponse: (res: unknown): Coupon[] =>
        Array.isArray(res) ? (res as ApiCoupon[]).map(normalizeCoupon) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "Coupon" as const, id: i.id })),
              { type: "Coupons" as const, id: "LIST" },
            ]
          : [{ type: "Coupons" as const, id: "LIST" }],
    }),
    getCouponByCode: b.query<Coupon | null, string>({
      query: (code) => ({ url: `/coupons/by-code/${encodeURIComponent(code)}` }),
      transformResponse: (res: unknown): Coupon | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? (res as ApiCoupon[])[0] : (res as ApiCoupon);
        return row ? normalizeCoupon(row) : null;
      },
      providesTags: (_r, _e, code) => [{ type: "Coupon", id: `CODE_${code}` }],
    }),

    getCouponById: b.query<Coupon, string>({
      query: (id) => ({ url: `/coupons/${id}` }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
      providesTags: (_r, _e, id) => [{ type: "Coupon", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCouponsQuery, useGetCouponByCodeQuery, useGetCouponByIdQuery } = couponsApi;
