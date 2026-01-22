// =============================================================
// FILE: src/integrations/types/orders.ts
// FINAL — Orders types + robust normalizers + query builders
// - payment_method is dynamic: known literals + arbitrary provider keys
// - fixes: Type 'string' is not assignable to type 'OrderPaymentMethod'
// =============================================================

import type { QueryParams, SortOrder } from '@/integrations/types';

import {
  isPlainObject,
  extractArray,
  clamp,
  toStr,
  toTrimStr,
  toNum,
  pickFirst,
  pickStr,
  pickOptStr,
} from '@/integrations/types';

/* -------------------- enums / literals -------------------- */

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';

export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned' | 'cancelled';

/**
 * IMPORTANT:
 * Backend payment methods are dynamic (provider key).
 * Keep known literals for autocomplete, but allow arbitrary strings.
 */
export type OrderPaymentMethodKnown =
  | 'credit_card'
  | 'bank_transfer'
  | 'wallet'
  | 'paytr_havale'
  | 'paytr'
  | 'shopier';

// allows any string while preserving known literals hints
export type OrderPaymentMethod = OrderPaymentMethodKnown | (string & {});

/* -------------------- domain models (FE normalized) -------------------- */

export type OrderView = {
  id: string;
  user_id: string;

  order_number: string;

  customer_name: string;
  customer_email: string;
  customer_phone: string | null;

  subtotal: number;
  discount: number;
  total: number;

  status: OrderStatus | string;
  payment_status: PaymentStatus | string;

  // FE view: API may return any provider key
  payment_method: string | null;

  coupon_code: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string | null;
};

export type OrderItemView = {
  id: string;
  order_id?: string;

  product_id: string | null;
  product_name: string;

  quantity: number;

  unit_price: number;
  total_price: number;

  activation_code: string | null;
  delivery_status: string | null;

  selected_options: Record<string, string> | null;

  api_order_id: string | null;
  turkpin_order_no: string | null;

  products?: {
    file_url: string | null;
    delivery_type: string | null;
    custom_fields?: Array<{
      id: string;
      label: string;
      type: string;
      placeholder: string;
      required: boolean;
    }> | null;
  } | null;

  delivery_content?: string;
};

export type OrderTimelineEvent = {
  id: string;
  order_id: string;
  type: 'note' | 'status_change' | 'payment' | 'refund' | 'shipment' | 'cancellation';
  message: string;
  actor?: { id: string; name: string | null } | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
};

/* -------------------- admin list params & bodies -------------------- */

export type OrdersAdminListParams = {
  q?: string;
  user_id?: string;

  status?: OrderStatus;
  payment_status?: PaymentStatus;

  starts_at?: string;
  ends_at?: string;

  min_total?: number;
  max_total?: number;

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'total' | 'status';
  order?: SortOrder;

  include?: Array<'user'>;
};

export type UpdateOrderStatusBody = {
  status: OrderStatus;
  note?: string | null;
  payment_status?: PaymentStatus;
};

export type RefundOrderBody = {
  amount: number;
  reason?: string | null;
  note?: string | null;
};

export type CancelOrderBody = {
  reason?: string | null;
  refund?: boolean;
  note?: string | null;
};

export type UpdateFulfillmentBody = {
  tracking_number?: string | null;
  tracking_url?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
  status?: FulfillmentStatus;
};

export type AddOrderNoteBody = { message: string };

export type OrdersAdminListItemsParams = {
  starts_at?: string;
  ends_at?: string;
  limit?: number;
  offset?: number;
};

/* -------------------- public list & create types -------------------- */

export type OrdersPublicListParams = {
  user_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'total';
  order?: SortOrder;
};

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

  // ✅ now supports dynamic provider keys
  payment_method: OrderPaymentMethod;
  payment_status?: string;

  coupon_code?: string | null;
  notes?: string | null;

  items: CreateOrderItemBody[];

  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
};

/* -------------------- order-specific helpers -------------------- */

const toLowerTrim = (v: unknown): string => toTrimStr(v).toLowerCase();

function unwrapOne(res: unknown): unknown {
  if (Array.isArray(res)) return res[0];

  if (isPlainObject(res)) {
    const o = res as Record<string, unknown>;
    for (const k of ['data', 'result', 'item'] as const) {
      const v = o[k];
      if (isPlainObject(v)) return v;
      if (Array.isArray(v)) return v[0];
    }
  }

  return res;
}

function normalizePaymentStatus(v: unknown): PaymentStatus | string {
  const s = toLowerTrim(v);
  if (!s) return 'unpaid';

  if (s === '1' || s === 'true') return 'paid';
  if (s === '0' || s === 'false') return 'unpaid';

  if (s === 'success' || s === 'succeeded' || s === 'completed') return 'paid';
  if (s === 'paid') return 'paid';
  if (s === 'unpaid') return 'unpaid';

  if (s === 'refund' || s === 'refunded') return 'refunded';
  if (s === 'partially_refunded' || s === 'partial_refund') return 'partially_refunded';
  if (s === 'failed' || s === 'error') return 'failed';

  return s;
}

function normalizeOrderStatus(v: unknown): OrderStatus | string {
  const s = toLowerTrim(v);
  return s || 'pending';
}

function idStr(v: unknown): string {
  const s = toTrimStr(v);
  if (s) return s;
  const x = toStr(v).trim();
  return x;
}

function optIdStr(v: unknown): string | undefined {
  const s = idStr(v);
  return s ? s : undefined;
}

/* -------------------- normalizers -------------------- */

export function normalizeOrder(row: unknown): OrderView {
  const base = unwrapOne(row);
  const o: Record<string, unknown> = isPlainObject(base) ? base : {};

  const subtotalSrc =
    pickFirst(o, ['subtotal', 'total_amount', 'total_price', 'totalAmount', 'totalPrice']) ?? 0;

  const discountSrc =
    pickFirst(o, ['discount', 'discount_amount', 'coupon_discount', 'discountAmount']) ?? 0;

  const totalSrc =
    pickFirst(o, ['total', 'final_amount', 'finalAmount', 'total_price', 'totalPrice']) ?? 0;

  const userRaw = pickFirst(o, ['user', 'users']);
  const userObj: Record<string, unknown> | null = isPlainObject(userRaw) ? userRaw : null;

  const customer_name =
    pickStr(o, ['customer_name', 'customerName', 'name', 'full_name'], '') ||
    (userObj ? pickStr(userObj, ['full_name', 'name'], '') : '');

  const customer_email =
    pickStr(o, ['customer_email', 'customerEmail', 'email'], '') ||
    (userObj ? pickStr(userObj, ['email'], '') : '');

  const id = idStr(pickFirst(o, ['id', 'order_id', 'orderId']));
  const user_id = idStr(pickFirst(o, ['user_id', 'userId']));
  const order_number = idStr(pickFirst(o, ['order_number', 'orderNumber', 'number', 'orderNo']));

  const createdAt = pickStr(o, ['created_at', 'createdAt'], new Date(0).toISOString());

  return {
    id,
    user_id,

    order_number,
    customer_name,
    customer_email,
    customer_phone: pickOptStr(o, ['customer_phone', 'customerPhone', 'phone']),

    subtotal: toNum(subtotalSrc, 0),
    discount: toNum(discountSrc, 0),
    total: toNum(totalSrc, 0),

    status: normalizeOrderStatus(pickFirst(o, ['status'])),
    payment_status: normalizePaymentStatus(pickFirst(o, ['payment_status', 'paymentStatus'])),
    payment_method: pickOptStr(o, ['payment_method', 'paymentMethod']),

    coupon_code: pickOptStr(o, ['coupon_code', 'coupon', 'couponCode']),
    notes: pickOptStr(o, ['notes', 'note']),

    created_at: createdAt,
    updated_at: pickOptStr(o, ['updated_at', 'updatedAt']),
  };
}

export function normalizeOrderList(res: unknown): OrderView[] {
  return extractArray(res).map(normalizeOrder);
}

export function normalizeOrderItem(row: unknown): OrderItemView {
  const o: Record<string, unknown> = isPlainObject(row) ? row : {};

  const qty = toNum(pickFirst(o, ['quantity', 'qty']), 0);

  const unitSrc = pickFirst(o, ['price', 'product_price', 'unit_price', 'unitPrice']) ?? 0;
  const totalSrc = pickFirst(o, ['total', 'total_price', 'totalPrice']) ?? 0;

  const selectedOptionsRaw = pickFirst(o, ['selected_options', 'selectedOptions', 'options']);
  const selected_options: Record<string, string> | null = isPlainObject(selectedOptionsRaw)
    ? Object.fromEntries(
        Object.entries(selectedOptionsRaw).map(([k, v]) => [String(k), toTrimStr(v) || toStr(v)]),
      )
    : null;

  const productsRaw = pickFirst(o, ['products', 'product']);
  const productsObj: Record<string, unknown> | null = isPlainObject(productsRaw)
    ? productsRaw
    : null;

  const customFieldsRaw = productsObj ? productsObj['custom_fields'] : null;
  const custom_fields = Array.isArray(customFieldsRaw)
    ? (customFieldsRaw as Array<Record<string, unknown>>).map((cf) => ({
        id: idStr(pickFirst(cf, ['id', 'field_id', 'fieldId'])),
        label: pickStr(cf, ['label']),
        type: pickStr(cf, ['type']),
        placeholder: pickStr(cf, ['placeholder']),
        required: Boolean(cf['required']),
      }))
    : null;

  const order_id = optIdStr(pickFirst(o, ['order_id', 'orderId']));

  const delivery_content =
    pickOptStr(o, ['delivery_content', 'deliveryContent']) ||
    pickOptStr(o, ['content', 'delivery_text', 'deliveryText', 'license_text', 'licenseText']) ||
    undefined;

  const activation_code =
    pickOptStr(o, ['activation_code', 'activationCode']) ||
    pickOptStr(o, [
      'code',
      'license_key',
      'licenseKey',
      'key',
      'serial',
      'serial_key',
      'serialKey',
    ]) ||
    null;

  const product_id_raw = pickFirst(o, ['product_id', 'productId']);
  const product_id =
    typeof product_id_raw === 'undefined' || product_id_raw === null
      ? null
      : idStr(product_id_raw) || null;

  const api_order_id =
    pickOptStr(o, ['api_order_id', 'apiOrderId']) ||
    (optIdStr(pickFirst(o, ['api_order_id', 'apiOrderId'])) ?? null);

  const turkpin_order_no =
    pickOptStr(o, ['turkpin_order_no', 'turkpinOrderNo']) ||
    (optIdStr(pickFirst(o, ['turkpin_order_no', 'turkpinOrderNo'])) ?? null);

  const base: Omit<OrderItemView, 'order_id' | 'products' | 'delivery_content'> = {
    id: idStr(pickFirst(o, ['id', 'order_item_id', 'orderItemId'])),

    product_id,
    product_name: pickStr(o, ['product_name', 'productName', 'name'], ''),

    quantity: qty,

    unit_price: toNum(unitSrc, 0),
    total_price: toNum(totalSrc, 0),

    activation_code,
    delivery_status: pickOptStr(o, ['delivery_status', 'deliveryStatus']),

    selected_options,

    api_order_id,
    turkpin_order_no,
  };

  return {
    ...base,

    ...(order_id ? { order_id } : {}),

    ...(productsObj
      ? {
          products: {
            file_url: pickOptStr(productsObj, ['file_url', 'fileUrl']),
            delivery_type: pickOptStr(productsObj, ['delivery_type', 'deliveryType']),
            ...(custom_fields ? { custom_fields } : {}),
          },
        }
      : { products: null }),

    ...(delivery_content ? { delivery_content } : {}),
  };
}

export function normalizeOrderItemList(res: unknown): OrderItemView[] {
  return extractArray(res).map(normalizeOrderItem);
}

export function normalizeOrderTimelineList(res: unknown): OrderTimelineEvent[] {
  const rows = extractArray(res);
  return rows.filter((x) => isPlainObject(x)) as OrderTimelineEvent[];
}

/* -------------------- query builders -------------------- */

export function toOrdersAdminQuery(p?: OrdersAdminListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.q) q.q = p.q;
  if (p.user_id) q.user_id = p.user_id;

  if (p.status) q.status = p.status;
  if (p.payment_status) q.payment_status = p.payment_status;

  if (p.starts_at) q.starts_at = p.starts_at;
  if (p.ends_at) q.ends_at = p.ends_at;

  if (typeof p.min_total === 'number') q.min_total = p.min_total;
  if (typeof p.max_total === 'number') q.max_total = p.max_total;

  if (typeof p.limit === 'number') q.limit = clamp(p.limit, 1, 200);
  if (typeof p.offset === 'number') q.offset = Math.max(0, p.offset);

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  if (p.include?.length) q.include = p.include.join(',');

  return Object.keys(q).length ? q : undefined;
}

export function toOrdersPublicQuery(p?: OrdersPublicListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status;
  if (p.payment_status) q.payment_status = p.payment_status;

  if (typeof p.limit === 'number') q.limit = clamp(p.limit, 1, 200);
  if (typeof p.offset === 'number') q.offset = Math.max(0, p.offset);

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}

export function toOrdersAdminItemsQuery(
  p?: OrdersAdminListItemsParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.starts_at) q.starts_at = p.starts_at;
  if (p.ends_at) q.ends_at = p.ends_at;
  if (typeof p.limit === 'number') q.limit = clamp(p.limit, 1, 200);
  if (typeof p.offset === 'number') q.offset = Math.max(0, p.offset);

  return Object.keys(q).length ? q : undefined;
}

/* -------------------- body mappers -------------------- */

export function toCreateOrderApiBody(body: CreateOrderBody): Record<string, unknown> {
  return {
    order_number: body.order_number,
    payment_method: body.payment_method, // ✅ dynamic ok
    payment_status: body.payment_status,
    coupon_code: typeof body.coupon_code === 'undefined' ? null : body.coupon_code,
    notes: typeof body.notes === 'undefined' ? null : body.notes,

    items: body.items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: toNum(i.quantity, 0),
      price: toNum(i.price, 0),
      total: typeof i.total === 'undefined' ? undefined : toNum(i.total, 0),
      options: typeof i.options === 'undefined' ? undefined : i.options,
    })),

    subtotal: typeof body.subtotal === 'undefined' ? undefined : toNum(body.subtotal, 0),
    discount: typeof body.discount === 'undefined' ? undefined : toNum(body.discount, 0),
    total: typeof body.total === 'undefined' ? undefined : toNum(body.total, 0),
  };
}
