// =============================================================
// FILE: src/integrations/metahub/db/types.ts
// =============================================================

/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

/** Ürün satırı (UI'nın beklediği normalize edilmiş tip) */
export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;

  image_url: string | null;
  rating: number;
  review_count: number;

  /** FE tarafında kesin boolean (BE 0/1 gelse bile normalize ediliyor) */
  is_active: boolean;

  created_at?: string;
  updated_at?: string;

  // join: select("*, categories(id, name, slug)")
  categories?: { id: string; name: string; slug: string };
};

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
  is_active: boolean;      // zorunlu
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
  display_pages: 'all' | 'home' | 'products' | 'categories' | string;
  display_frequency: 'always' | 'once' | 'daily' | 'weekly' | string;
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
  role: 'admin' | 'moderator' | 'user';
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

/** ✅ Yeni: Kupon satırı (normalize edilmiş) */
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

/** ✅ Yeni: Sepet öğesi (normalize edilmiş) */
export type CartItemRow = {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  options?: Record<string, unknown> | null;
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
  content: string;           // HTML
  category: string;          // normalize: "Genel"
  author_name: string;       // DB: author
  created_at: string;
  image_url: string;         // DB: featured_image
  read_time: string;         // "X dk"
  is_published: boolean;     // tinyint(1) normalize
  is_featured: boolean;      // normalize: false
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
  display_order: number;   // UI bekliyor
  is_active: boolean;      // kesin boolean
  locale?: string | null;
  links: FooterLink[];     // her zaman dizi (boş da olabilir)
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
  | "user_roles";
  

// TableRow eşlemesini güncelle:
export type TableRow<TName extends string> =
  TName extends "categories" ? CategoryRow :
  TName extends "products" ? ProductRow :
  TName extends "product_reviews" ? ProductReviewRow :
  TName extends "product_faqs" ? ProductFaqRow :
  TName extends "site_settings" ? SiteSettingRow :
  TName extends "menu_items" ? MenuItemRow :
  TName extends "footer_sections" ? FooterSectionRow :
  TName extends "popups" ? PopupRow :
  TName extends "user_roles" ? UserRoleRow :
  TName extends "topbar_settings" ? TopbarSettingRow :
  TName extends "coupons" ? CouponRow :
  TName extends "cart_items" ? CartItemRow :
  TName extends "blog_posts" ? BlogPostRow :
  TName extends "custom_pages" ? CustomPageView :
  UnknownRow;
