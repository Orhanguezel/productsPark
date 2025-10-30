// ===================================================================
// FILE: src/modules/orders/types.ts
// ===================================================================
import type { OrderRow, OrderItemRow } from "./schema";

export type OrderView = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
};

export type OrderItemView = {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  total_price: number;
  activation_code: string | null;
  delivery_status: string | null;
  selected_options?: Record<string, string> | null;
  api_order_id?: string | null;
  turkpin_order_no?: string | null;
  product_id: string | null;
  products?: { file_url: string | null; delivery_type: string | null; custom_fields?: any[] | null };
  delivery_content?: string | null;
};

const toNum = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));

export function mapOrderRowToView(
  r: OrderRow,
  user: { full_name?: string | null; email?: string | null; phone?: string | null } | null,
): OrderView {
  return {
    id: r.id,
    order_number: r.order_number,
    customer_name: (user?.full_name ?? "").trim(),
    customer_email: (user?.email ?? "").trim(),
    customer_phone: user?.phone ?? null,
    total_amount: toNum(r.subtotal),
    discount_amount: toNum(r.discount),
    final_amount: toNum(r.total),
    status: r.status,
    payment_status: r.payment_status,
    payment_method: r.payment_method ?? null,
    notes: (r as any).notes ?? null,
    created_at: String((r as any).created_at),
    user_id: r.user_id,
  };
}

export function mapOrderItemRowToView(r: OrderItemRow): OrderItemView {
  let selected: Record<string, string> | null = null;
  const v = (r as any).options;
  if (v) {
    if (typeof v === "string") {
      try { selected = JSON.parse(v); } catch { selected = null; }
    } else {
      selected = v as Record<string, string>;
    }
  }

  return {
    id: r.id,
    product_name: r.product_name,
    quantity: toNum(r.quantity),
    product_price: toNum(r.price),
    total_price: toNum(r.total),
    activation_code: (r as any).activation_code ?? null,
    delivery_status: (r as any).delivery_status ?? null,
    selected_options: selected,
    api_order_id: (r as any).api_order_id ?? null,
    turkpin_order_no: (r as any).turkpin_order_no ?? null,
    product_id: (r as any).product_id ?? null,
    delivery_content: (r as any).delivery_content ?? null,
  };
}
