

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/coupons.endpoints.ts
// =============================================================
import { baseApi as baseApi3 } from "../baseApi";

const toNumber3 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));

export type CouponType = "percent" | "amount";
export type Coupon = {
  id: string;
  code: string;
  title?: string | null;
  discount_type: CouponType;
  discount_value: number; // percent or fixed amount, UI will interpret by type
  min_order_total?: number | null;
  max_discount?: number | null;
  is_active: 0 | 1 | boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiCoupon = Omit<Coupon, "discount_value" | "min_order_total" | "max_discount"> & {
  discount_value: number | string;
  min_order_total?: number | string | null;
  max_discount?: number | string | null;
};

const normalizeCoupon = (c: ApiCoupon): Coupon => ({
  ...c,
  discount_value: toNumber3(c.discount_value),
  min_order_total: c.min_order_total == null ? null : toNumber3(c.min_order_total),
  max_discount: c.max_discount == null ? null : toNumber3(c.max_discount),
});

export const couponsApi = baseApi3.injectEndpoints({
  endpoints: (b) => ({
    listCoupons: b.query<
      Coupon[],
      { is_active?: 0 | 1 | boolean; q?: string; limit?: number; offset?: number; sort?: "created_at" | "updated_at"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/coupons", params }),
      transformResponse: (res: unknown): Coupon[] => Array.isArray(res) ? (res as ApiCoupon[]).map(normalizeCoupon) : [],
      providesTags: (result) => result
        ? [...result.map((i) => ({ type: "Coupon" as const, id: i.id })), { type: "Coupons" as const, id: "LIST" }]
        : [{ type: "Coupons" as const, id: "LIST" }],
    }),

    getCouponByCode: b.query<Coupon, string>({
      query: (code) => ({ url: `/coupons/by-code/${code}` }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res as ApiCoupon),
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
