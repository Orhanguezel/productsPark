// =============================================================
// FILE: src/integrations/metahub/db/types/cart.ts
// - Admin Carts (aggregate sepetler)
// - Public Cart Items (tekil satırlar + products join)
// =============================================================

/* -------------------- ADMIN CARTS (carts_admin) -------------------- */

/** Admin paneldeki sepet satırı (normalize edilmiş) */
export type AdminCartItem = {
  id: string;
  product_id: string;
  variant_id?: string | null;
  name: string;
  sku: string | null;
  qty: number;
  price: number;    // unit
  subtotal: number; // qty * price
  image_url?: string | null;
  meta?: Record<string, unknown> | null; // chosen options, vs.
};

/** BE'den gelen ham satır (string/number karışık + meta JSON-string olabilir) */
export type AdminApiCartItem = Omit<
  AdminCartItem,
  "qty" | "price" | "subtotal" | "meta"
> & {
  qty: number | string;
  price: number | string;
  subtotal: number | string;
  meta?: string | Record<string, unknown> | null;
};

/** Admin paneldeki sepet (normalize edilmiş) */
export type AdminCart = {
  id: string;
  user_id: string | null; // null => guest cart
  user?: { id: string; email: string | null; name: string | null } | null;
  currency: string;
  items: AdminCartItem[];
  subtotal: number;
  discount_total: number;
  total_price: number;
  coupon_code: string | null;
  note: string | null;
  is_locked?: boolean; // checkout sırasında kilitlenmiş olabilir
  created_at: string;  // ISO
  updated_at: string | null; // ISO
};

/** BE'den gelen ham sepet (string/number karışık + items JSON-string olabilir) */
export type AdminApiCart = Omit<
  AdminCart,
  "items" | "subtotal" | "discount_total" | "total_price" | "updated_at" | "user"
> & {
  items: string | AdminApiCartItem[];
  subtotal: number | string;
  discount_total: number | string;
  total_price: number | string;
  updated_at: string | null;
  user?: { id: string; email: string | null; name: string | null } | null;
};

/* -------------------- PUBLIC CART ITEMS (/cart_items) -------------------- */

/** /cart_items join ile dönen ürün (normalize edilmiş) */
export type PublicCartItemProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  delivery_type?: string | null;
  stock_quantity?: number | null;
  custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options?: { quantity: number; price: number }[] | null;
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;
  category_id?: string | null;
  categories?: { id: string; name: string } | null;
};

/** BE'den gelebilecek ham ürün tipi (string/number karışık + JSON-string toleransı) */
export type PublicApiCartItemProduct = Omit<
  PublicCartItemProduct,
  "price" | "stock_quantity" | "quantity_options" | "custom_fields" | "categories"
> & {
  price?: number | string | null;
  stock_quantity?: number | string | null;
  quantity_options?: string | PublicCartItemProduct["quantity_options"];
  custom_fields?:
    | string
    | ReadonlyArray<Record<string, unknown>>
    | null;
  categories?: { id?: string; name?: string } | null;
};

/** /cart_items endpoint'inin FE tarafında kullanılacak normalize edilmiş tipi */
export type PublicCartItem = {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  /** FE & BE ortak isim */
  selected_options?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  products?: PublicCartItemProduct | null;
};

/** BE'den gelen ham satır (quantity / selected_options flexible) */
export type PublicApiCartItem = Omit<
  PublicCartItem,
  "quantity" | "selected_options" | "products"
> & {
  quantity: number | string;
  selected_options?: string | PublicCartItem["selected_options"];
  products?: PublicApiCartItemProduct | null;
};
