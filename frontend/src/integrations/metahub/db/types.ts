// =============================================================
// FILE: src/integrations/metahub/db/types.ts
// =============================================================

/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

/* ===========================
 * Domain Row Types
 * =========================== */

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  icon: string | null;
  description: string | null;
  is_featured?: boolean | 0 | 1;
  parent_id: string | null;
  display_order?: number;
  product_count: number;
};

export type SiteSettingRow = {
  id: string;
  key: string;
  value: unknown;
  created_at?: string;
  updated_at?: string;
};

export type ProductReviewRow = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
  is_active?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type ProductFaqRow = {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type MenuItemRow = {
  id: string;
  title: string;

  /** FE kesin bekliyor → normalize ile garanti edeceğiz */
  url: string;

  /** footer tarafı için kullanılıyor, header’da da null olabilir */
  section_id: string | null;

  /** 🔧 BURASI: icon artık zorunlu (null olabilir ama undefined olamaz) */
  icon: string | null;

  // opsiyoneller
  href?: string | null;
  slug?: string | null;
  parent_id: string | null;
  position?: number | null;
  order_num?: number | null;
  is_active: boolean; // zorunlu
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FooterSectionRow = {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PopupRow = {
  id: string;
  title: string | null;

  /** FE doğrudan kullanıyor */
  image_url: string | null;
  content?: string | null;
  content_html?: string | null;

  /** görünürlük & davranış */
  is_active: boolean;
  display_pages: "all" | "home" | "products" | "categories" | string;
  display_frequency: "always" | "once" | "daily" | "weekly" | string;
  delay_seconds: number | null;
  duration_seconds: number | null;
  priority: number | null;

  /** aksiyon alanları */
  coupon_code: string | null;
  button_text: string | null;
  button_link: string | null;

  /** ilişkili ürün (join ile gelebilir) */
  product_id?: string | null;
  products?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price: number;
    original_price: number | null;
  };

  /** opsiyoneller / meta */
  key?: string | null;
  type?: string | null;
  options?: unknown;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at?: string;
};

export type TopbarSettingRow = {
  id: string;
  is_active: boolean;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** ✅ Kupon satırı (normalize edilmiş) */
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

/** ✅ Sepet öğesi (normalize edilmiş) */
export type CartItemRow = {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  /** FE’nin okuduğu isim */
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
    custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
    quantity_options?: { quantity: number; price: number }[] | null;
    api_provider_id?: string | null;
    api_product_id?: string | null;
    api_quantity?: number | null;
    category_id?: string | null;
    categories?: { id: string; name: string } | null;
  } | null;
};



export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML
  category: string; // normalize: "Genel"
  author_name: string; // DB: author
  created_at: string;
  image_url: string; // DB: featured_image
  read_time: string; // "X dk"
  is_published: boolean; // tinyint(1) normalize
  is_featured: boolean; // normalize: false
  published_at?: string | null;
  updated_at?: string;
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionView = {
  id: string;
  title: string;
  display_order: number; // UI bekliyor
  is_active: boolean; // kesin boolean
  locale?: string | null;
  links: FooterLink[]; // her zaman dizi (boş da olabilir)
  // opsiyoneller
  created_at?: string;
  updated_at?: string;
};

export type CustomPageView = {
  id: string;
  title: string;
  slug: string;
  /** UI'nin beklediği düz HTML string */
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SupportTicketView = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "waiting_response" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  /** UI burada zorunlu görüyor → null olabilir ama undefined olamaz */
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketReplyView = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};

export type WalletTransactionRow = {
  id: string;
  user_id: string;
  amount: number; // normalize
  type: "deposit" | "withdrawal" | "purchase" | "refund";
  description: string | null;
  order_id?: string | null;
  created_at: string;
};

export type WalletDepositRequestRow = {
  id: string;
  user_id: string;
  amount: number; // normalize
  payment_method: string; // "havale" vb.
  payment_proof?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  admin_notes?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  wallet_balance: number; // FE bu alanı number bekliyor
  created_at: string; // ISO
  updated_at: string; // ISO
};

/** ---- VIEW tipleri (UI’nin beklediği) ---- */
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
  product_name: string;
  quantity: number;
  product_price: number;
  total_price: number;
  activation_code: string | null;
  delivery_status: string | null;
  selected_options?: Record<string, string> | null;
  product_id: string | null;
  products?: { file_url: string | null; delivery_type: string | null };
  delivery_content?: string | null; // DB’de olmayabilir
}

/** ---- DB satır tipleri (opsiyonel, istiyorsan tut) ---- */
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
  price: number;
  total: number;
  activation_code: string | null;
  delivery_status: string | null;
  options?: Record<string, string> | null;
  product_id: string | null;
  products?: { file_url: string | null; delivery_type: string | null };
}

/** Ürün satırı (UI'nın beklediği normalize edilmiş tip) */
export type ProductRow = {
  id: string;
  name: string;
  slug: string;

  /** Liste için kısa metin; detayda yoksa description kullanılabilir */
  short_description: string | null;
  /** Detay sayfasında HTML olabilir (opsiyonel) */
  description?: string | null;

  category_id: string | null;

  price: number;
  /** DB: compare_at_price → FE: original_price */
  original_price: number | null;

  /** Kapak görseli */
  image_url: string | null;
  /** Galeri (DB: images) */
  gallery_urls?: string[] | null;

  /** Basit özellik listesi (opsiyonel) */
  features?: string[] | null;

  /** FE tarafında kesin number (normalize defaults: rating=5) */
  rating: number;
  /** FE tarafında kesin number (normalize defaults: 0) */
  review_count: number;

  /** Stok & kimlik alanları */
  sku?: string | null;
  stock_quantity?: number | null;

  /** Bayraklar */
  is_active: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  requires_shipping?: boolean;

  /** SEO */
  meta_title?: string | null;
  meta_description?: string | null;

  /** Teslimat/ürün tipi (opsiyonel) */
  product_type?: string | null;
  delivery_type?: string | null;

  /** Özel alanlar / adet-seçenekleri (opsiyonel) */
  custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options?: { quantity: number; price: number }[] | null;

  /** Rozetler (opsiyonel) */
  badges?: Array<{ text: string; icon?: string | null; active: boolean }> | null;

  /** İçerik & Demo (opsiyonel) */
  article_content?: string | null;
  article_enabled?: boolean;
  demo_url?: string | null;
  demo_embed_enabled?: boolean;
  demo_button_text?: string | null;

  created_at?: string;
  updated_at?: string;

  // join: select("*, categories(id, name, slug)")
  categories?: { id: string; name: string; slug: string };
};

/** View tip (FE’nin beklediği genişletilmiş ürün tipi) */
export type ProductView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  cost: string | number | null; // normalize katmanı sayıya çeviriyor → burada geniş bırakıldı
  image_url: string | null;
  gallery_urls: string[] | null;
  features: string[] | null;
  rating: number;
  review_count: number;
  product_type?: string | null;
  delivery_type?: string | null;
  custom_fields?:
    | Array<{
        id: string;
        label: string;
        type: "text" | "email" | "phone" | "url" | "textarea";
        placeholder?: string | null;
        required: boolean;
      }>
    | null;
  quantity_options?: Array<{ quantity: number; price: number }> | null;
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  article_content?: string | null;
  article_enabled?: boolean;
  demo_url?: string | null;
  demo_embed_enabled?: boolean;
  demo_button_text?: string | null;
  badges?: Array<{ text: string; icon?: string | null; active: boolean }> | null;
  sku?: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  requires_shipping: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; slug?: string };
};

/* ===========================
 * Known Tables & TableRow map
 * =========================== */

/** Bu projede bildiğimiz tüm tablo adları */
export type KnownTables =
  | "products"
  | "categories"
  | "orders"
  | "order_items"
  | "cart_items"
  | "coupons"
  | "blog_posts"
  | "product_stock"
  | "product_reviews"
  | "product_faqs"
  | "profiles"
  | "wallet_transactions"
  | "wallet_deposit_requests"
  | "payment_requests"
  | "product_variants"
  | "product_options"
  | "product_option_values"
  | "site_settings"
  | "topbar_settings"
  | "popups"
  | "email_templates"
  | "menu_items"
  | "footer_sections"
  | "custom_pages"
  | "payment_providers"
  | "payment_sessions"
  | "uploads"
  | "notifications"
  | "activity_logs"
  | "audit_events"
  | "telemetry_events"
  | "user_roles"
  | "support_tickets"
  | "ticket_replies";

/** TableRow eşlemesi */
export type TableRow<TName extends string> = TName extends "categories"
  ? CategoryRow
  : TName extends "products"
  ? ProductRow
  : TName extends "product_reviews"
  ? ProductReviewRow
  : TName extends "product_faqs"
  ? ProductFaqRow
  : TName extends "site_settings"
  ? SiteSettingRow
  : TName extends "menu_items"
  ? MenuItemRow
  : TName extends "footer_sections"
  ? FooterSectionRow
  : TName extends "popups"
  ? PopupRow
  : TName extends "user_roles"
  ? UserRoleRow
  : TName extends "topbar_settings"
  ? TopbarSettingRow
  : TName extends "coupons"
  ? CouponRow
  : TName extends "cart_items"
  ? CartItemRow
  : TName extends "blog_posts"
  ? BlogPostRow
  : TName extends "custom_pages"
  ? CustomPageView
  : TName extends "support_tickets"
  ? SupportTicketView
  : TName extends "ticket_replies"
  ? TicketReplyView
  : TName extends "wallet_transactions"
  ? WalletTransactionRow
  : TName extends "wallet_deposit_requests"
  ? WalletDepositRequestRow
  : TName extends "profiles"
  ? ProfileRow
  : TName extends "orders" ? OrderView
  : TName extends "order_items" ? OrderItemView
  : UnknownRow;
