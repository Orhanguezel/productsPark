// =============================================================
// FILE: src/integrations/rtk/admin/carts_admin.endpoints.ts
// FINAL — Admin Carts RTK (central types+normalizers, BASE constant)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminCart,
  AdminCartsListParams,
  AdminCartAddItemBody,
  AdminCartUpdateItemBody,
  AdminCartUpdateCartBody,
  AdminCartMergeBody,
  AdminCartApplyCouponBody,
} from '@/integrations/types';
import {
  normalizeAdminCart,
  normalizeAdminCartList,
  toAdminCartsQuery,
} from '@/integrations/types';

const BASE = '/admin/carts';

export const cartsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCartsAdmin: b.query<AdminCart[], AdminCartsListParams | void>({
      query: (params) => {
        const qs = toAdminCartsQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): AdminCart[] => normalizeAdminCartList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Carts' as const, id: c.id })),
              { type: 'Carts' as const, id: 'LIST' },
            ]
          : [{ type: 'Carts' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    getCartAdminById: b.query<AdminCart, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      providesTags: (_r, _e, id) => [{ type: 'Carts' as const, id }],
    }),

    listCartItemsAdmin: b.query<AdminCart['items'], string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/items`, method: 'GET' }),
      // Backend çoğu zaman cart döner; burada items bekleniyorsa: array -> normalize
      transformResponse: (res: unknown): AdminCart['items'] => {
        // res cart döndüyse
        if (!Array.isArray(res)) {
          const c = normalizeAdminCart(res);
          return c.items;
        }
        // res items döndüyse
        const c = normalizeAdminCart({ id: '__tmp__', items: res });
        return c.items;
      },
      providesTags: (_r, _e, id) => [{ type: 'Carts' as const, id: `ITEMS_${id}` }],
    }),

    addCartItemAdmin: b.mutation<AdminCart, { id: string; body: AdminCartAddItemBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/items`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.id },
        { type: 'Carts' as const, id: `ITEMS_${arg.id}` },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),

    updateCartItemAdmin: b.mutation<
      AdminCart,
      { id: string; item_id: string; body: AdminCartUpdateItemBody }
    >({
      query: ({ id, item_id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/items/${encodeURIComponent(item_id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.id },
        { type: 'Carts' as const, id: `ITEMS_${arg.id}` },
      ],
    }),

    removeCartItemAdmin: b.mutation<AdminCart, { id: string; item_id: string }>({
      query: ({ id, item_id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/items/${encodeURIComponent(item_id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.id },
        { type: 'Carts' as const, id: `ITEMS_${arg.id}` },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),

    clearCartAdmin: b.mutation<AdminCart, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}/clear`,
        method: 'POST',
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Carts' as const, id },
        { type: 'Carts' as const, id: `ITEMS_${id}` },
      ],
    }),

    mergeCartsAdmin: b.mutation<AdminCart, AdminCartMergeBody>({
      query: ({ target_id, source_id }) => ({
        url: `${BASE}/${encodeURIComponent(target_id)}/merge`,
        method: 'POST',
        body: { source_id },
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.target_id },
        { type: 'Carts' as const, id: arg.source_id },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),

    applyCouponCartAdmin: b.mutation<AdminCart, { id: string; body: AdminCartApplyCouponBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/coupon`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.id },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),

    removeCouponCartAdmin: b.mutation<AdminCart, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}/coupon`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Carts' as const, id },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),

    updateCartAdmin: b.mutation<AdminCart, { id: string; body: AdminCartUpdateCartBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): AdminCart => normalizeAdminCart(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Carts' as const, id: arg.id },
        { type: 'Carts' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCartsAdminQuery,
  useGetCartAdminByIdQuery,
  useListCartItemsAdminQuery,
  useAddCartItemAdminMutation,
  useUpdateCartItemAdminMutation,
  useRemoveCartItemAdminMutation,
  useClearCartAdminMutation,
  useMergeCartsAdminMutation,
  useApplyCouponCartAdminMutation,
  useRemoveCouponCartAdminMutation,
  useUpdateCartAdminMutation,
} = cartsAdminApi;
