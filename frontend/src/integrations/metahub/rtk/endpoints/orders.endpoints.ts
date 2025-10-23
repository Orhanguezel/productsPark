// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/orders.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import { toNumber, isObject } from "@/integrations/metahub/core/normalize";

// ---- Tipler ----
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

// BE ham tip (bazı alanlar string gelebilir)
export type ApiOrder = Omit<Order, "total_price"> & { total_price: number | string };

const normalizeOrder = (o: ApiOrder): Order => ({
  ...o,
  total_price: toNumber(o.total_price),
});

// Listeyanıtını güvenli ayrıştır ([] veya { data: [] })
const extractArray = (res: unknown): ApiOrder[] => {
  if (Array.isArray(res)) return res as ApiOrder[];
  if (isObject(res) && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: unknown[] }).data as ApiOrder[];
  }
  return [];
};

// Arg serileştirmesini deterministik yap (cache anahtarı sabit)
const serializeArgs = (endpointName: string, queryArgs: Record<string, unknown> | undefined) => {
  const obj = Object.fromEntries(
    Object.entries(queryArgs ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  );
  return `${endpointName}(${JSON.stringify(obj)})`;
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrders: b.query<
      Order[],
      {
        user_id?: string;
        status?: OrderStatus;
        payment_status?: PaymentStatus;
        limit?: number;
        offset?: number;
        sort?: "created_at" | "total_price";
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] => extractArray(res).map(normalizeOrder),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        serializeArgs(endpointName, queryArgs as Record<string, unknown> | undefined),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((o) => ({ type: "Order" as const, id: o.id })),
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getOrderById: b.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
      keepUnusedDataFor: 300,
    }),

    // ör: GET /orders/by-user/:userId
    listOrdersByUser: b.query<Order[], string>({
      query: (userId) => ({ url: `/orders/by-user/${userId}` }),
      transformResponse: (res: unknown): Order[] => extractArray(res).map(normalizeOrder),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        serializeArgs(endpointName, queryArgs as Record<string, unknown> | undefined),
      providesTags: (_r, _e, userId) => [{ type: "Orders", id: `USER_${userId}` }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersQuery,
  useGetOrderByIdQuery,
  useListOrdersByUserQuery,
} = ordersApi;
