
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/orders_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* keep string */ }
  }
  return x as T;
};
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "refunded" | "failed";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partially_refunded" | "failed";
export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled" | "returned" | "cancelled";

export type Address = {
  full_name: string;
  line1: string; line2?: string | null;
  city: string; state?: string | null; country: string; postal_code?: string | null;
  phone?: string | null;
};

export type OrderItem = {
  id: string;
  product_id: string;
  sku: string | null;
  name: string;
  qty: number;
  price: number; // unit price
  subtotal: number; // qty * price
  variant_id?: string | null;
  image_url?: string | null;
};

export type Order = {
  id: string;
  code: string; // human-readable order code
  user_id: string | null;
  user?: { id: string; email: string | null; name: string | null } | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total_price: number;
  items: OrderItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_provider: string | null;
  is_test: boolean;
  note: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string; // ISO
  updated_at: string | null; // ISO
};

export type ApiOrder = Omit<Order,
  | "subtotal" | "discount_total" | "shipping_total" | "tax_total" | "total_price"
  | "items" | "shipping_address" | "billing_address"
  | "is_test" | "updated_at" | "user"
> & {
  subtotal: number | string; discount_total: number | string; shipping_total: number | string; tax_total: number | string; total_price: number | string;
  items: string | OrderItem[];
  shipping_address: string | Address | null;
  billing_address: string | Address | null;
  is_test: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  updated_at: string | null;
  user?: { id: string; email: string | null; name: string | null } | null;
};

const normalizeOrder = (o: ApiOrder): Order => ({
  ...o,
  user_id: (o.user_id ?? null) as string | null,
  user: o.user ? { id: o.user.id, email: o.user.email ?? null, name: o.user.name ?? null } : null,
  subtotal: toNumber(o.subtotal),
  discount_total: toNumber(o.discount_total),
  shipping_total: toNumber(o.shipping_total),
  tax_total: toNumber(o.tax_total),
  total_price: toNumber(o.total_price),
  items: Array.isArray(o.items) ? o.items : tryParse<OrderItem[]>(o.items),
  shipping_address: o.shipping_address ? (typeof o.shipping_address === "string" ? tryParse<Address>(o.shipping_address) : o.shipping_address) : null,
  billing_address: o.billing_address ? (typeof o.billing_address === "string" ? tryParse<Address>(o.billing_address) : o.billing_address) : null,
  is_test: toBool(o.is_test),
  note: (o.note ?? null) as string | null,
  metadata: (o.metadata ?? null) as Record<string, unknown> | null,
  updated_at: o.updated_at ? toIso(o.updated_at) : null,
});

export type OrderTimelineEvent = {
  id: string;
  order_id: string;
  type: "note" | "status_change" | "payment" | "refund" | "shipment" | "cancellation";
  message: string;
  actor?: { id: string; name: string | null } | null;
  meta?: Record<string, unknown> | null;
  created_at: string; // ISO
};

export type ApiOrderTimelineEvent = Omit<OrderTimelineEvent, never>;

export type ListParams = {
  q?: string; // search by code/email/name
  user_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  is_test?: boolean;
  min_total?: number; max_total?: number;
  starts_at?: string; // ISO (created_at >=)
  ends_at?: string;   // ISO (created_at <=)
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "total_price" | "status";
  order?: "asc" | "desc";
  include?: Array<"user">;
};

export type UpdateStatusBody = { status: OrderStatus; note?: string | null };
export type RefundBody = { amount: number; reason?: string | null; note?: string | null };
export type CancelBody = { reason?: string | null; refund?: boolean; note?: string | null };
export type FulfillmentBody = { tracking_number?: string | null; tracking_url?: string | null; carrier?: string | null; shipped_at?: string | null; status?: FulfillmentStatus };
export type AddNoteBody = { message: string };

export const ordersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrdersAdmin: b.query<Order[], ListParams | void>({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] => Array.isArray(res) ? (res as ApiOrder[]).map(normalizeOrder) : [],
      providesTags: (result) => result ? [
        ...result.map((o) => ({ type: "Orders" as const, id: o.id })),
        { type: "Orders" as const, id: "LIST" },
      ] : [{ type: "Orders" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getOrderAdminById: b.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),

    updateOrderStatusAdmin: b.mutation<Order, { id: string; body: UpdateStatusBody }>({
      query: ({ id, body }) => ({ url: `/orders/${id}/status`, method: "PATCH", body }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    cancelOrderAdmin: b.mutation<Order, { id: string; body?: CancelBody }>({
      query: ({ id, body }) => ({ url: `/orders/${id}/cancel`, method: "POST", body }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    refundOrderAdmin: b.mutation<Order, { id: string; body: RefundBody }>({
      query: ({ id, body }) => ({ url: `/orders/${id}/refund`, method: "POST", body }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    updateOrderFulfillmentAdmin: b.mutation<Order, { id: string; body: FulfillmentBody }>({
      query: ({ id, body }) => ({ url: `/orders/${id}/fulfillment`, method: "PATCH", body }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    listOrderTimelineAdmin: b.query<OrderTimelineEvent[], string>({
      query: (id) => ({ url: `/orders/${id}/timeline` }),
      transformResponse: (res: unknown): OrderTimelineEvent[] => Array.isArray(res) ? (res as ApiOrderTimelineEvent[]) : [],
      providesTags: (_r, _e, id) => [{ type: "Orders", id: `TIMELINE_${id}` }],
    }),

    addOrderNoteAdmin: b.mutation<{ ok: true }, { id: string; body: AddNoteBody }>({
      query: ({ id, body }) => ({ url: `/orders/${id}/timeline`, method: "POST", body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: `TIMELINE_${arg.id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersAdminQuery,
  useGetOrderAdminByIdQuery,
  useUpdateOrderStatusAdminMutation,
  useCancelOrderAdminMutation,
  useRefundOrderAdminMutation,
  useUpdateOrderFulfillmentAdminMutation,
  useListOrderTimelineAdminQuery,
  useAddOrderNoteAdminMutation,
} = ordersAdminApi;
