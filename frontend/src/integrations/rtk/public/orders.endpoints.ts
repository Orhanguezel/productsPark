// =============================================================
// FILE: src/integrations/rtk/public/orders.endpoints.ts
// FINAL — Orders RTK (backend ile birebir uyumlu)
// - GET /orders (filters + paging + sort)
// - GET /orders/by-user/:userId
// - GET /orders/:id (items dahil; ayrıca /items endpoint YOK)
// - POST /orders
// - POST /orders/checkout
// - PATCH /orders/:id
// - PATCH /order_items/:id
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  OrderView,
  OrderItemView,
  OrdersPublicListParams,
  CreateOrderBody,
} from '@/integrations/types';

import {
  normalizeOrder,
  normalizeOrderList,
  normalizeOrderItemList,
  toOrdersPublicQuery,
  toCreateOrderApiBody,
} from '@/integrations/types';

const BASE = '/orders';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Orders'] as const });

function stableKey(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(entries));
}

/**
 * Backend GET /orders/:id response:
 * { ...mapOrder(ord), ...ord, items }
 * items: order_items rows (options parse edilmiş) döner.
 *
 * Biz OrderView’e normalize ederken items’ı ayrıca normalize edip iliştiriyoruz.
 */
function extractItems(res: unknown): unknown {
  if (!res || typeof res !== 'object') return null;
  const o = res as Record<string, unknown>;
  return o.items ?? null;
}

export const ordersApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /orders
    listOrders: b.query<OrderView[], OrdersPublicListParams | void>({
      query: (p) => {
        // backend query paramları: id,status,payment_status,limit,offset,sort,order
        const qp = toOrdersPublicQuery(p);
        return { url: BASE, method: 'GET', ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): OrderView[] => normalizeOrderList(res),

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const arg = (queryArgs ?? {}) as Record<string, unknown>;
        return `${endpointName}(${stableKey(arg)})`;
      },

      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((o) => ({ type: 'Orders' as const, id: o.id })),
              { type: 'Orders' as const, id: 'LIST' },
            ]
          : [{ type: 'Orders' as const, id: 'LIST' }],

      keepUnusedDataFor: 60,
    }),

    // GET /orders/by-user/:userId
    listOrdersByUser: b.query<OrderView[], string>({
      query: (userId) => ({
        url: `${BASE}/by-user/${encodeURIComponent(userId)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): OrderView[] => normalizeOrderList(res),

      providesTags: (_r, _e, userId) => [
        { type: 'Orders' as const, id: `USER_${userId}` },
        { type: 'Orders' as const, id: 'LIST' },
      ],

      keepUnusedDataFor: 60,
    }),

    // GET /orders/:id  (items dahil)
    getOrderById: b.query<OrderView & { items?: OrderItemView[] }, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => {
        const order = normalizeOrder(res) as OrderView & { items?: OrderItemView[] };
        const rawItems = extractItems(res);
        const items = rawItems ? normalizeOrderItemList(rawItems) : [];
        return { ...order, items };
      },

      providesTags: (_r, _e, id) => [{ type: 'Orders' as const, id }],
      keepUnusedDataFor: 300,
    }),

    // POST /orders
    createOrder: b.mutation<OrderView & { items?: OrderItemView[] }, CreateOrderBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toCreateOrderApiBody(body),
      }),
      transformResponse: (res: unknown) => {
        const order = normalizeOrder(res) as OrderView & { items?: OrderItemView[] };
        const rawItems = extractItems(res);
        const items = rawItems ? normalizeOrderItemList(rawItems) : [];
        return { ...order, items };
      },
      invalidatesTags: (result) =>
        result?.id
          ? [
              { type: 'Orders' as const, id: result.id },
              { type: 'Orders' as const, id: 'LIST' },
            ]
          : [{ type: 'Orders' as const, id: 'LIST' }],
    }),

    // POST /orders/checkout
    checkoutFromCart: b.mutation<OrderView & { items?: OrderItemView[] }, CreateOrderBody>({
      query: (body) => ({
        url: `${BASE}/checkout`,
        method: 'POST',
        body: toCreateOrderApiBody(body),
      }),
      transformResponse: (res: unknown) => {
        const order = normalizeOrder(res) as OrderView & { items?: OrderItemView[] };
        const rawItems = extractItems(res);
        const items = rawItems ? normalizeOrderItemList(rawItems) : [];
        return { ...order, items };
      },
      invalidatesTags: (result) =>
        result?.id
          ? [
              { type: 'Orders' as const, id: result.id },
              { type: 'Orders' as const, id: 'LIST' },
            ]
          : [{ type: 'Orders' as const, id: 'LIST' }],
    }),

    // PATCH /orders/:id
    updateOrder: b.mutation<OrderView, { id: string; patch: Record<string, unknown> }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): OrderView => normalizeOrder(res),
      invalidatesTags: (result, _e, arg) => [
        { type: 'Orders' as const, id: result?.id ?? arg.id },
        { type: 'Orders' as const, id: 'LIST' },
      ],
    }),

    // PATCH /order_items/:id
    updateOrderItem: b.mutation<OrderItemView, { id: string; patch: Record<string, unknown> }>({
      query: ({ id, patch }) => ({
        url: `/order_items/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): OrderItemView => {
        // backend tek item döndürüyor; normalizeOrderItemList array bekliyorsa tekil normalize et
        const list = normalizeOrderItemList([res]);
        return list[0] as OrderItemView;
      },
      // Order item update sonrası listeyi de invalid etmek mantıklı
      invalidatesTags: () => [{ type: 'Orders' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersQuery,
  useListOrdersByUserQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCheckoutFromCartMutation,
  useUpdateOrderMutation,
  useUpdateOrderItemMutation,
} = ordersApi;
