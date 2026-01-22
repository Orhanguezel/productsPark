// =============================================================
// FILE: src/integrations/rtk/admin/orders_admin.endpoints.ts
// FINAL — Admin Orders RTK (robust unwrap + include=user + timeline wrapper-safe)
// - exactOptionalPropertyTypes friendly
// - no any
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  OrderView,
  OrderItemView,
  OrdersAdminListParams,
  OrdersAdminListItemsParams,
  UpdateOrderStatusBody,
  RefundOrderBody,
  CancelOrderBody,
  UpdateFulfillmentBody,
  AddOrderNoteBody,
  OrderTimelineEvent,
} from '@/integrations/types';

import {
  normalizeOrder,
  normalizeOrderList,
  normalizeOrderItemList,
  normalizeOrderTimelineList,
  toOrdersAdminQuery,
  toOrdersAdminItemsQuery,
} from '@/integrations/types';

const BASE = '/admin/orders';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Orders'] as const });

export const ordersAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/orders
    listOrdersAdmin: b.query<OrderView[], OrdersAdminListParams | void>({
      query: (p) => {
        // ✅ default include=user for customer/user info
        const params: OrdersAdminListParams | void =
          p && typeof p === 'object'
            ? { ...p, include: Array.from(new Set([...(p.include ?? []), 'user'])) }
            : ({ include: ['user'] } as OrdersAdminListParams);

        const qp = toOrdersAdminQuery(params);
        return { url: BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): OrderView[] => normalizeOrderList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((o) => ({ type: 'Orders' as const, id: o.id })),
              { type: 'Orders' as const, id: 'LIST' },
            ]
          : [{ type: 'Orders' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/orders/:id
    getOrderAdminById: b.query<OrderView, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        // backend destekliyorsa user join:
        params: { include: 'user' },
      }),
      transformResponse: (res: unknown): OrderView => normalizeOrder(res),
      providesTags: (_r, _e, id) => [{ type: 'Orders' as const, id }],
    }),

    // GET /admin/orders/:id/items
    listOrderItemsAdmin: b.query<OrderItemView[], string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/items` }),
      transformResponse: (res: unknown): OrderItemView[] => normalizeOrderItemList(res),
      providesTags: (_r, _e, id) => [{ type: 'Orders' as const, id: `ITEMS_${id}` }],
    }),

    // PATCH /admin/orders/:id/status
    updateOrderStatusAdmin: b.mutation<OrderView, { id: string; body: UpdateOrderStatusBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): OrderView => normalizeOrder(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Orders' as const, id: arg.id },
        { type: 'Orders' as const, id: 'LIST' },
        { type: 'Orders' as const, id: `ITEMS_${arg.id}` },
      ],
    }),

    // POST /admin/orders/:id/cancel
    cancelOrderAdmin: b.mutation<OrderView, { id: string; body?: CancelOrderBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        ...(typeof body !== 'undefined' ? { body } : {}),
      }),
      transformResponse: (res: unknown): OrderView => normalizeOrder(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Orders' as const, id: arg.id },
        { type: 'Orders' as const, id: 'LIST' },
        { type: 'Orders' as const, id: `ITEMS_${arg.id}` },
      ],
    }),

    // POST /admin/orders/:id/refund
    refundOrderAdmin: b.mutation<OrderView, { id: string; body: RefundOrderBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/refund`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): OrderView => normalizeOrder(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Orders' as const, id: arg.id },
        { type: 'Orders' as const, id: 'LIST' },
        { type: 'Orders' as const, id: `ITEMS_${arg.id}` },
      ],
    }),

    // PATCH /admin/orders/:id/fulfillment
    updateOrderFulfillmentAdmin: b.mutation<OrderView, { id: string; body: UpdateFulfillmentBody }>(
      {
        query: ({ id, body }) => ({
          url: `${BASE}/${encodeURIComponent(id)}/fulfillment`,
          method: 'PATCH',
          body,
        }),
        transformResponse: (res: unknown): OrderView => normalizeOrder(res),
        invalidatesTags: (_r, _e, arg) => [
          { type: 'Orders' as const, id: arg.id },
          { type: 'Orders' as const, id: 'LIST' },
        ],
      },
    ),

    // GET /admin/orders/:id/timeline
    listOrderTimelineAdmin: b.query<OrderTimelineEvent[], string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/timeline` }),
      transformResponse: (res: unknown): OrderTimelineEvent[] => normalizeOrderTimelineList(res),
      providesTags: (_r, _e, id) => [{ type: 'Orders' as const, id: `TIMELINE_${id}` }],
    }),

    // POST /admin/orders/:id/timeline
    addOrderNoteAdmin: b.mutation<{ ok: true }, { id: string; body: AddOrderNoteBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/timeline`,
        method: 'POST',
        body,
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Orders' as const, id: `TIMELINE_${arg.id}` }],
    }),

    // DELETE /admin/orders/:id
    deleteOrderAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Orders' as const, id },
        { type: 'Orders' as const, id: 'LIST' },
      ],
    }),

    // GET /admin/orders/items
    listAllOrderItemsAdmin: b.query<OrderItemView[], OrdersAdminListItemsParams | void>({
      query: (p) => {
        const qp = toOrdersAdminItemsQuery(p);
        return { url: `${BASE}/items`, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): OrderItemView[] => normalizeOrderItemList(res),
      providesTags: [{ type: 'Orders' as const, id: 'ITEMS_ALL' }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersAdminQuery,
  useGetOrderAdminByIdQuery,
  useListOrderItemsAdminQuery,
  useUpdateOrderStatusAdminMutation,
  useCancelOrderAdminMutation,
  useRefundOrderAdminMutation,
  useUpdateOrderFulfillmentAdminMutation,
  useListOrderTimelineAdminQuery,
  useAddOrderNoteAdminMutation,
  useDeleteOrderAdminMutation,
  useListAllOrderItemsAdminQuery,
} = ordersAdminApi;
