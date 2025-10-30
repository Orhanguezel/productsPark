// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  OrderView,
  OrderItemView,
  // Timeline tiplerini bu dosyadan da alıyoruz
} from "../../../db/types/orders";

// ------------------------------ local types ------------------------------
export type OrderStatus =
  | "pending"
  | "paid"       // FE filtre için tutuluyor (BE 'payment_status')
  | "processing"
  | "shipped"    // FE filtre için tutuluyor (timeline/fulfillment)
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partially_refunded" | "failed";

export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled" | "returned" | "cancelled";

export type ListParams = {
  q?: string;
  user_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  starts_at?: string; // ISO (created_at >=)
  ends_at?: string;   // ISO (created_at <=)
  min_total?: number;
  max_total?: number;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "total_price" | "status";
  order?: "asc" | "desc";
  include?: Array<"user">;
};

export type UpdateStatusBody = { status: OrderStatus; note?: string | null };
export type RefundBody = { amount: number; reason?: string | null; note?: string | null };
export type CancelBody = { reason?: string | null; refund?: boolean; note?: string | null };
export type FulfillmentBody = {
  tracking_number?: string | null;
  tracking_url?: string | null;
  carrier?: string | null;
  shipped_at?: string | null; // ISO
  status?: FulfillmentStatus;
};
export type AddNoteBody = { message: string };

export type OrderTimelineEvent = {
  id: string;
  order_id: string;
  type: "note" | "status_change" | "payment" | "refund" | "shipment" | "cancellation";
  message: string;
  actor?: { id: string; name: string | null } | null;
  meta?: Record<string, unknown> | null;
  created_at: string; // ISO
};

// ------------------------------ helpers ------------------------------
// ------------------------------ helpers ------------------------------
type HttpParams = Record<string, string | number | boolean>;

const clamp = (n: number, min = 1, max = 200) => Math.max(min, Math.min(max, n));

const normalizeListParams = (p?: ListParams): HttpParams | undefined => {
  if (!p) return undefined;
  const q: HttpParams = {};
  if (p.q) q.q = p.q;
  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status;
  if (p.payment_status) q.payment_status = p.payment_status;
  if (p.starts_at) q.starts_at = p.starts_at;
  if (p.ends_at) q.ends_at = p.ends_at;
  if (p.min_total != null) q.min_total = p.min_total;
  if (p.max_total != null) q.max_total = p.max_total;
  if (p.limit != null) q.limit = clamp(Number(p.limit), 1, 200);
  if (p.offset != null) q.offset = Math.max(0, Number(p.offset));
  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;
  if (p.include?.length) q.include = p.include.join(",");
  return q;
};


const BASE_ADMIN = "/admin/orders";

// ------------------------------ endpoints ------------------------------
export const ordersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrdersAdmin: b.query<OrderView[], ListParams | void>({
      query: (params) => ({ url: `${BASE_ADMIN}`, params: normalizeListParams(params as ListParams | undefined) }),
      transformResponse: (res: unknown): OrderView[] => (Array.isArray(res) ? (res as OrderView[]) : []),
      providesTags: (result) =>
        result
          ? [...result.map((o) => ({ type: "Orders" as const, id: o.id })), { type: "Orders" as const, id: "LIST" }]
          : [{ type: "Orders" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getOrderAdminById: b.query<OrderView, string>({
      query: (id) => ({ url: `${BASE_ADMIN}/${id}` }),
      transformResponse: (res: unknown): OrderView => res as OrderView,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),

    listOrderItemsAdmin: b.query<OrderItemView[], string>({
      query: (id) => ({ url: `${BASE_ADMIN}/${id}/items` }),
      transformResponse: (res: unknown): OrderItemView[] => (Array.isArray(res) ? (res as OrderItemView[]) : []),
      providesTags: (_r, _e, id) => [{ type: "Orders", id: `ITEMS_${id}` }],
    }),

    updateOrderStatusAdmin: b.mutation<OrderView, { id: string; body: UpdateStatusBody }>({
      query: ({ id, body }) => ({ url: `${BASE_ADMIN}/${id}/status`, method: "PATCH", body }),
      transformResponse: (res: unknown): OrderView => res as OrderView,
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    cancelOrderAdmin: b.mutation<OrderView, { id: string; body?: CancelBody }>({
      query: ({ id, body }) => ({ url: `${BASE_ADMIN}/${id}/cancel`, method: "POST", body }),
      transformResponse: (res: unknown): OrderView => res as OrderView,
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    refundOrderAdmin: b.mutation<OrderView, { id: string; body: RefundBody }>({
      query: ({ id, body }) => ({ url: `${BASE_ADMIN}/${id}/refund`, method: "POST", body }),
      transformResponse: (res: unknown): OrderView => res as OrderView,
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    updateOrderFulfillmentAdmin: b.mutation<OrderView, { id: string; body: FulfillmentBody }>({
      query: ({ id, body }) => ({ url: `${BASE_ADMIN}/${id}/fulfillment`, method: "PATCH", body }),
      transformResponse: (res: unknown): OrderView => res as OrderView,
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: arg.id }, { type: "Orders", id: "LIST" }],
    }),

    listOrderTimelineAdmin: b.query<OrderTimelineEvent[], string>({
      query: (id) => ({ url: `${BASE_ADMIN}/${id}/timeline` }),
      transformResponse: (res: unknown): OrderTimelineEvent[] =>
        Array.isArray(res) ? (res as OrderTimelineEvent[]) : [],
      providesTags: (_r, _e, id) => [{ type: "Orders", id: `TIMELINE_${id}` }],
    }),

    addOrderNoteAdmin: b.mutation<{ ok: true }, { id: string; body: AddNoteBody }>({
      query: ({ id, body }) => ({ url: `${BASE_ADMIN}/${id}/timeline`, method: "POST", body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Orders", id: `TIMELINE_${arg.id}` }],
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
} = ordersAdminApi;
