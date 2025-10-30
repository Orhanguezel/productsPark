// =============================================================
// FILE: src/integrations/metahub/db/types/orders.ts
// =============================================================

export type CouponRow = {
  id: string;
  code: string;
  title?: string | null;

  discount_type: "percentage" | "fixed";
  discount_value: number;

  min_purchase: number;
  max_discount?: number | null;

  is_active: boolean;
  max_uses?: number | null;
  used_count?: number | null;

  valid_from?: string | null;
  valid_until?: string | null;

  applicable_to?: "all" | "category" | "product";
  category_ids?: string[] | null;
  product_ids?: string[] | null;

  created_at?: string;
  updated_at?: string;
};

export type CartItemRow = {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  selected_options?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    delivery_type?: string | null;
    stock_quantity?: number | null;
    custom_fields?: { [k: string]: unknown }[] | null; // mutable array (FE uyumlu)
    quantity_options?: { quantity: number; price: number }[] | null;
    api_provider_id?: string | null;
    api_product_id?: string | null;
    api_quantity?: number | null;
    category_id?: string | null;
    categories?: { id: string; name: string } | null;
  } | null;
};

export interface OrderView {
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
}

export interface OrderItemView {
  id: string;

  // FE tablo alanları
  product_name: string;
  quantity: number;
  product_price: number; // unit price
  total_price: number;

  activation_code: string | null;
  delivery_status: string | null;

  // FE’de options paneli (readonly değil — FE mutasyona izin veriyor)
  selected_options?: Record<string, string> | null;

  // API/sağlayıcı bilgileri (FE kullanıyor)
  api_order_id?: string | null;
  turkpin_order_no?: string | null;

  product_id: string | null;

  products?: {
    file_url: string | null;
    delivery_type: string | null;
    // FE OrderDetail’de .find() ile gezilen alanlar — mutable array olmalı
    custom_fields?: {
      id: string;
      label: string;
      type: string;
      placeholder: string;
      required: boolean;
    }[] | null;
  };

  // Manuel teslimat içeriği
  delivery_content?: string | null;
}

/* DB yazım tarafında kullanılan ham satırlar */
export interface OrderRow {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
}

export interface OrderItemRow {
  id: string;
  product_name: string;
  quantity: number;
  price: number; // unit price
  total: number;
  activation_code: string | null;
  delivery_status: string | null;
  options?: Record<string, string> | null;
  product_id: string | null;
  products?: {
    file_url: string | null;
    delivery_type: string | null;
  };
}
