// =============================================================
// FILE: src/integrations/rtk/public/cart_items_public.endpoints.ts
// FINAL — Public CartItems RTK (central types+normalizers, BASE constant)
// Backend:
// - GET    /cart_items
// - GET    /cart_items/:id
// - POST   /cart_items
// - PATCH  /cart_items/:id
// - DELETE /cart_items/:id
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  PublicCartItem,
  PublicCartItemsListParams,
  PublicCartItemCreateBody,
  PublicCartItemPatchBody,
} from '@/integrations/types';
import {
  normalizePublicCartItem,
  normalizePublicCartItemList,
  toPublicCartItemsQuery,
} from '@/integrations/types';

const BASE = '/cart_items';

export const cartItemsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCartItems: b.query<PublicCartItem[], PublicCartItemsListParams | void>({
      query: (params) => {
        const qs = toPublicCartItemsQuery(params ?? undefined);
        return { url: `${BASE}${qs}`, method: 'GET' };
      },
      transformResponse: (res: unknown): PublicCartItem[] => normalizePublicCartItemList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: 'CartItem' as const, id: i.id })),
              { type: 'CartItems' as const, id: 'LIST' },
            ]
          : [{ type: 'CartItems' as const, id: 'LIST' }],
    }),

    getCartItemById: b.query<PublicCartItem, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): PublicCartItem => normalizePublicCartItem(res),
      providesTags: (_r, _e, id) => [{ type: 'CartItem' as const, id }],
    }),

    createCartItem: b.mutation<PublicCartItem, PublicCartItemCreateBody>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown): PublicCartItem => normalizePublicCartItem(res),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'CartItem' as const, id: result.id },
              { type: 'CartItems' as const, id: 'LIST' },
            ]
          : [{ type: 'CartItems' as const, id: 'LIST' }],
    }),

    updateCartItem: b.mutation<PublicCartItem, PublicCartItemPatchBody>({
      query: ({ id, ...patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): PublicCartItem => normalizePublicCartItem(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'CartItem' as const, id: arg.id },
        { type: 'CartItems' as const, id: 'LIST' },
      ],
    }),

    deleteCartItem: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'CartItem' as const, id },
        { type: 'CartItems' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCartItemsQuery,
  useGetCartItemByIdQuery,
  useCreateCartItemMutation,
  useUpdateCartItemMutation,
  useDeleteCartItemMutation,
} = cartItemsApi;
