// =============================================================
// FILE: src/integrations/rtk/admin/coupons_admin.endpoints.ts
// FINAL — Coupons Admin RTK (central types+normalizers, BASE constant)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  Coupon,
  CouponListParams,
  CreateCouponBody,
  UpdateCouponBody,
} from '@/integrations/types';
import {
  normalizeCoupon,
  normalizeCouponList,
  toCouponsQuery,
  toCouponApiBody,
} from '@/integrations/types';

const BASE = '/admin/coupons';

export const couponsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCouponsAdmin: b.query<Coupon[], CouponListParams | void>({
      query: (params) => {
        const qs = toCouponsQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): Coupon[] => normalizeCouponList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Coupons' as const, id: c.id })),
              { type: 'Coupons' as const, id: 'LIST' },
            ]
          : [{ type: 'Coupons' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getCouponAdminById: b.query<Coupon, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res),
      providesTags: (_r, _e, id) => [{ type: 'Coupons' as const, id }],
    }),

    createCouponAdmin: b.mutation<Coupon, CreateCouponBody>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body: toCouponApiBody(body),
      }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res),
      invalidatesTags: [{ type: 'Coupons' as const, id: 'LIST' }],
    }),

    updateCouponAdmin: b.mutation<Coupon, { id: string; body: UpdateCouponBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toCouponApiBody(body),
      }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Coupons' as const, id: arg.id },
        { type: 'Coupons' as const, id: 'LIST' },
      ],
    }),

    toggleCouponAdmin: b.mutation<Coupon, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/${active ? 'enable' : 'disable'}`,
        method: 'POST',
      }),
      transformResponse: (res: unknown): Coupon => normalizeCoupon(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Coupons' as const, id: arg.id },
        { type: 'Coupons' as const, id: 'LIST' },
      ],
    }),

    deleteCouponAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'Coupons' as const, id: 'LIST' }],
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
