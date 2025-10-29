// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/orders.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import { toNumber, isObject } from "@/integrations/metahub/core/normalize";
import type { OrderView as Order } from "@/integrations/metahub/db/types";

// ---- Tipler ----
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed" | "pending";

// Liste yanıtını güvenli ayrıştır ([] veya { data: [] })
const extractArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObject(res) && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: unknown[] }).data as unknown[];
  }
  return [];
};

// Obje argümanları deterministik serileştir (sadece listOrders kullanacak)
const serializeArgsObj = (endpointName: string, queryArgs: unknown) => {
  const isPlainObj =
    !!queryArgs && typeof queryArgs === "object" && !Array.isArray(queryArgs);
  const obj = isPlainObj ? (queryArgs as Record<string, unknown>) : {};
  const sorted = Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  );
  return `${endpointName}(${JSON.stringify(sorted)})`;
};

// Her türlü varyantı Order (OrderView) haline getir
const normalizeOrder = (x: unknown): Order => {
  const o = (x ?? {}) as Record<string, unknown>;
  const pick = <T>(k: string, alt?: string, d?: T): T => {
    const v = o[k] ?? (alt ? o[alt] : undefined);
    return (v as T) ?? (d as T);
  };

  const subtotal = toNumber(pick<number | string>("total_amount", "subtotal", 0));
  const discount = toNumber(pick<number | string>("discount_amount", "discount", 0));
  const total = toNumber(pick<number | string>("final_amount", "total", 0));

  return {
    id: String(pick("id", "", "")),
    user_id: String(pick("user_id", "", "")),
    order_number: String(pick("order_number", "number", "")),
    customer_name: String(pick("customer_name", "", "")),
    customer_email: String(pick("customer_email", "", "")),
    customer_phone: (o["customer_phone"] ?? null) as string | null,
    total_amount: subtotal,
    discount_amount: discount,
    final_amount: total,
    status: String(pick("status", "", "pending")),
    payment_status: String(pick("payment_status", "", "pending")),
    payment_method: (o["payment_method"] ?? null) as string | null,
    notes: (typeof o["notes"] === "string" ? (o["notes"] as string) : null),
    created_at: String(pick("created_at", "", new Date().toISOString())),
  };
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Liste
    listOrders: b.query<
      Order[],
      {
        user_id?: string;
        status?: OrderStatus;
        payment_status?: PaymentStatus;
        limit?: number;
        offset?: number;
        sort?: "created_at" | "total_price" | "final_amount"; // her iki isim de destek
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] => extractArray(res).map(normalizeOrder),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        serializeArgsObj(endpointName, queryArgs),
      providesTags: (result) =>
        result && result.length
          ? [
            ...result.map((o) => ({ type: "Order" as const, id: o.id })),
            { type: "Orders" as const, id: "LIST" },
          ]
          : [{ type: "Orders" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // Detay
    getOrderById: b.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: (res: unknown): Order => normalizeOrder(res),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
      keepUnusedDataFor: 300,
    }),

    // Kullanıcıya göre liste
    listOrdersByUser: b.query<Order[], string>({
      query: (userId) => ({ url: `/orders/by-user/${userId}` }),
      transformResponse: (res: unknown): Order[] => extractArray(res).map(normalizeOrder),
      // serializeQueryArgs KULLANMIYORUZ (arg string!)
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
