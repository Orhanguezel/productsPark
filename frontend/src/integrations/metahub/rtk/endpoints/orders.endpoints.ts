// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/orders.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed" | "pending";

export type Order = {
  id: string;
  user_id: string;
  number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_price: number;
  currency: string;
  coupon_code?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiOrder = Omit<Order, "total_price"> & { total_price: number | string };

const normalizeOrder = (o: ApiOrder): Order => ({
  ...o,
  total_price: toNumber(o.total_price),
});

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrders: b.query<
      Order[],
      { user_id?: string; status?: OrderStatus; payment_status?: PaymentStatus; limit?: number; offset?: number; sort?: "created_at" | "total_price"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] => Array.isArray(res) ? (res as ApiOrder[]).map(normalizeOrder) : [],
      providesTags: (result) => result
        ? [...result.map((o) => ({ type: "Order" as const, id: o.id })), { type: "Orders" as const, id: "LIST" }]
        : [{ type: "Orders" as const, id: "LIST" }],
    }),

    getOrderById: b.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),

    listOrdersByUser: b.query<Order[], string>({
      query: (userId) => ({ url: `/orders/by-user/${userId}` }),
      transformResponse: (res: unknown): Order[] => Array.isArray(res) ? (res as ApiOrder[]).map(normalizeOrder) : [],
      providesTags: (_r, _e, userId) => [{ type: "Orders", id: `USER_${userId}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListOrdersQuery, useGetOrderByIdQuery, useListOrdersByUserQuery } = ordersApi;