// =============================================================
// FILE: src/integrations/metahub/db/types/products.ts
// =============================================================

/** Ortak küçük tipler */
export type CategoryBrief = { id: string; name: string; slug: string };
export type QuantityOption = { quantity: number; price: number };
export type Badge = { text: string; icon?: string | null; active: boolean };

/** Kategori satırı (Admin listelerinde minimal) */
export type CategoryRow = {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  is_featured?: boolean | 0 | 1 | null;
};

/** İlişkili entity satır tipleri */
export type ProductReviewRow = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type ProductFaqRow = {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type ProductStockRow = {
  id: string;
  product_id: string;
  stock_content: string; // BE alan adı
  is_used: boolean | 0 | 1;
  used_at: string | null;
  created_at: string;
  order_item_id: string | null;
};

/** Ana ürün satırı (BE ham alan adları) */
export type ProductRow = {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  short_description: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;
  cost?: number | null;

  // Görseller (legacy + storage)
  image_url: string | null; // legacy
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;

  gallery_urls?: string[] | null;
  gallery_asset_ids?: string[] | null;

  features?: string[] | null;

  rating: number;
  review_count: number;

  product_type?: string | null;
  delivery_type?: "manual" | "auto_stock" | "file" | "api" | string | null;

  custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options?: QuantityOption[] | null;

  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;

  meta_title?: string | null;
  meta_description?: string | null;

  article_content?: string | null;
  article_enabled?: boolean | 0 | 1;
  demo_url?: string | null;
  demo_embed_enabled?: boolean | 0 | 1;
  demo_button_text?: string | null;

  badges?: Badge[] | null;

  sku?: string | null;
  stock_quantity: number;

  is_active: boolean | 0 | 1;
  is_featured?: boolean | 0 | 1;
  show_on_homepage?: boolean | 0 | 1;
  is_digital?: boolean | 0 | 1;
  requires_shipping?: boolean | 0 | 1;

  epin_game_id?: string | null;
  epin_product_id?: string | null;
  auto_delivery_enabled?: boolean | 0 | 1;
  pre_order_enabled?: boolean | 0 | 1;

  min_order?: number | null;
  max_order?: number | null;
  min_barem?: number | null;
  max_barem?: number | null;
  barem_step?: number | null;

  tax_type?: number | null;

  file_url?: string | null;

  created_at: string;
  updated_at?: string;

  // İlişkiler
  categories?: { id: string; name: string; slug: string };
};

/** FE’de normalize edilmiş ürün tipi */
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;
  cost: number | null;

  // Görseller (normalize)
  image_url: string | null;                  // legacy
  featured_image: string | null;             // fallback ile doldurulabilir
  featured_image_asset_id: string | null;
  featured_image_alt: string | null;
  gallery_urls: string[] | null;
  gallery_asset_ids: string[] | null;

  features: string[] | null;

  rating: number;
  review_count: number;

  product_type?: string | null;
  delivery_type?: "manual" | "auto_stock" | "file" | "api" | string | null;

  custom_fields?: Array<{
    id: string;
    label: string;
    type: "text" | "email" | "phone" | "url" | "textarea";
    placeholder?: string | null;
    required: boolean;
  }> | null;

  quantity_options?: QuantityOption[] | null;

  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;

  meta_title?: string | null;
  meta_description?: string | null;

  article_content?: string | null;
  article_enabled?: boolean | 0 | 1;
  demo_url?: string | null;
  demo_embed_enabled?: boolean | 0 | 1;
  demo_button_text?: string | null;

  badges?: Badge[] | null;

  sku?: string | null;
  stock_quantity: number;

  is_active: boolean | 0 | 1;
  is_featured: boolean | 0 | 1;
  requires_shipping: boolean | 0 | 1;

  created_at: string;
  updated_at: string;

  categories?: CategoryBrief;
};

/**
 * BE ham response tipi (string sayısallar, CSV/JSON dizi alanları vb.)
 * Legacy alanlar: compare_at_price, images
 * Yeni storage alanları: featured_image*, gallery_asset_ids
 */
export type ApiProduct = Omit<
  Product,
  | "price"
  | "original_price"
  | "cost"
  | "gallery_urls"
  | "gallery_asset_ids"
  | "features"
  | "rating"
  | "review_count"
  | "featured_image"
  | "featured_image_asset_id"
  | "featured_image_alt"
> & {
  // sayısallar string gelebilir
  price: number | string;
  original_price?: number | string | null;
  /** Legacy isim */
  compare_at_price?: number | string | null;

  cost?: number | string | null;

  /** Dizi alanlar string/CSV/JSON gelebilir */
  gallery_urls?: string[] | string | null;
  images?: string[] | string | null;
  gallery_asset_ids?: string[] | string | null;
  features?: string[] | string | null;

  /** Storage alanları */
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;

  /** Sayısal metrikler string gelebilir */
  rating?: number | string | null;
  review_count?: number | string | null;

  /** Boolean alanlar 0/1/string gelebilir */
  is_active?: boolean | 0 | 1 | "0" | "1";
  is_featured?: boolean | 0 | 1 | "0" | "1";
  show_on_homepage?: boolean | 0 | 1 | "0" | "1";
  is_digital?: boolean | 0 | 1 | "0" | "1";
  requires_shipping?: boolean | 0 | 1 | "0" | "1";
  article_enabled?: boolean | 0 | 1 | "0" | "1";
  demo_embed_enabled?: boolean | 0 | 1 | "0" | "1";
  auto_delivery_enabled?: boolean | 0 | 1 | "0" | "1";
  pre_order_enabled?: boolean | 0 | 1 | "0" | "1";

  /** E-PIN / barem & sipariş sınırlamaları (string gelebilir) */
  epin_game_id?: string | null;
  epin_product_id?: string | null;

  min_order?: number | string | null;
  max_order?: number | string | null;
  min_barem?: number | string | null;
  max_barem?: number | string | null;
  barem_step?: number | string | null;

  /** Vergi tipi (string gelebilir) */
  tax_type?: number | string | null;

  /** Dosya teslimatı */
  file_url?: string | null;

  // tarih alanları BE’de opsiyonel olabilir
  created_at?: string;
  updated_at?: string;
};


export type ProductAdmin = ProductRow;
export type Review = ProductReviewRow;
export type FAQ = ProductFaqRow;

/** Used Stock birleşik tipi */
export type UsedStockItem = ProductStockRow & {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email?: string | null;
  } | null;
};

/** Public product options */
export type ProductOption = {
  id: string;
  product_id: string;
  option_name: string;
  option_values: string[]; // BE string/JSON gelebilir, FE normalize eder
  created_at: string;
  updated_at: string;
};

/** Public stock list tip (BE 'stock_content' → FE 'code' normalize edilir) */
export type Stock = {
  id: string;
  product_id: string;
  code?: string;              // FE adı
  stock_content?: string;     // BE adı
  is_used: boolean | 0 | 1;
  used_at?: string | null;
  created_at: string;
  order_item_id?: string | null;
};

/** Admin liste parametreleri */
export type ProductsAdminListParams = {
  q?: string;
  category_id?: string;
  is_active?: boolean | 0 | 1;
  show_on_homepage?: boolean | 0 | 1;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "price" | "name" | "review_count" | "rating";
  order?: "asc" | "desc";
};

/** Upsert/Patch tipleri (rating BE’de hesaplanır) */
export type UpsertProductBody = Omit<
  ProductRow,
  "id" | "created_at" | "updated_at" | "categories" | "rating"
>;
export type PatchProductBody = Partial<UpsertProductBody>;

/** API provider minimal tipi */
export type ApiProviderRow = { id: string; name: string; is_active: boolean | 0 | 1 };
