// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/orders.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import { toNumber, isObject } from "@/integrations/metahub/core/normalize";
import type { OrderView as Order } from "@/integrations/metahub/db/types";

// ---- Tipler ----
// DDL: ("pending","processing","completed","cancelled","refunded")
export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

// ---- CREATE BODY (Wallet + normal siparişler için) ----
export type CreateOrderItemBody = {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number | string;
  total?: number | string;
  options?: unknown;
};

export type CreateOrderBody = {
  order_number?: string;
  payment_method: "credit_card" | "bank_transfer" | "wallet" | "paytr_havale" | "paytr" | "shopier";
  payment_status?: string;
  coupon_code?: string | null;
  notes?: string | null;
  items: CreateOrderItemBody[];
  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
};

// Liste yanıtını güvenli ayrıştır ([] veya { data: [] })
const extractArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObject(res) && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: unknown[] }).data as unknown[];
  }
  return [];
};

const val = (o: Record<string, unknown>, k: string, alt?: string) =>
  o[k] ?? (alt ? o[alt] : undefined);

// Her türlü varyantı Order (OrderView) haline getir
const normalizeOrder = (x: unknown): Order => {
  const o = (x ?? {}) as Record<string, unknown>;

  const subtotalSource =
    val(o, "total_amount") ?? val(o, "subtotal") ?? val(o, "total_price") ?? 0;
  const discountSource =
    val(o, "discount_amount") ??
    val(o, "discount") ??
    val(o, "coupon_discount") ??
    0;
  const totalSource =
    val(o, "final_amount") ?? val(o, "total") ?? val(o, "total_price") ?? 0;

  const subtotal = toNumber(subtotalSource);
  const discount = toNumber(discountSource);
  const total = toNumber(totalSource);

  return {
    id: String(val(o, "id") ?? ""),
    user_id: String(val(o, "user_id") ?? ""),
    order_number: String(val(o, "order_number", "number") ?? ""),
    customer_name: String(val(o, "customer_name") ?? ""),
    customer_email: String(val(o, "customer_email") ?? ""),
    customer_phone: (o["customer_phone"] ?? null) as string | null,
    total_amount: subtotal,
    discount_amount: discount,
    final_amount: total,
    status: String(val(o, "status") ?? "pending"),
    payment_status: String(val(o, "payment_status") ?? "pending"),
    payment_method: (o["payment_method"] ?? null) as string | null,
    notes: typeof o["notes"] === "string" ? (o["notes"] as string) : null,
    created_at: String(
      val(o, "created_at") ?? new Date().toISOString()
    ),
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
        sort?: "created_at" | "total_price";
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] =>
        extractArray(res).map(normalizeOrder),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const isPlainObj =
          !!queryArgs && typeof queryArgs === "object" && !Array.isArray(queryArgs);
        const obj = isPlainObj ? (queryArgs as Record<string, unknown>) : {};
        const sorted = Object.fromEntries(
          Object.entries(obj)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .sort(([a], [b]) => a.localeCompare(b))
        );
        return `${endpointName}(${JSON.stringify(sorted)})`;
      },
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
      transformResponse: (res: unknown): Order[] =>
        extractArray(res).map(normalizeOrder),
      providesTags: (_r, _e, userId) => [{ type: "Orders", id: `USER_${userId}` }],
      keepUnusedDataFor: 60,
    }),

    // ✅ CREATE (Wallet dahil tüm siparişler bunu kullanacak)
    createOrder: b.mutation<Order, CreateOrderBody>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Order => normalizeOrder(res),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "Order" as const, id: result.id },
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersQuery,
  useGetOrderByIdQuery,
  useListOrdersByUserQuery,
  useCreateOrderMutation,    // 👈 yeni hook
} = ordersApi;
