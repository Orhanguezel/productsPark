// =============================================================
// FILE: src/integrations/rtk/public/coupons_public.endpoints.ts
// FINAL — Coupons Public RTK (central types+normalizers, BASE constant)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { Coupon, CouponListParams } from '@/integrations/types';
import { normalizeCoupon, normalizeCouponList, toCouponsQuery } from '@/integrations/types';

const BASE = '/coupons';

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCoupons: b.query<Coupon[], CouponListParams | void>({
      query: (params) => {
        const qs = toCouponsQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): Coupon[] => normalizeCouponList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Coupon' as const, id: c.id })),
              { type: 'Coupon' as const, id: 'LIST' },
            ]
          : [{ type: 'Coupon' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getCouponById: b.query<Coupon, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res),
      providesTags: (_r, _e, id) => [{ type: 'Coupon' as const, id }],
    }),

    getCouponByCode: b.query<Coupon | null, string>({
      query: (code) => ({
        url: `${BASE}/by-code/${encodeURIComponent(code)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): Coupon | null => {
        if (!res) return null;
        const row = Array.isArray(res) ? (res as unknown[])[0] : res;
        return row ? normalizeCoupon(row) : null;
      },
      providesTags: (_r, _e, code) => [{ type: 'Coupon' as const, id: `CODE_${code}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCouponsQuery, useGetCouponByIdQuery, useGetCouponByCodeQuery } = couponsApi;
