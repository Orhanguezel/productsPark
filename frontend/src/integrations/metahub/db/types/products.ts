// =============================================================
// FILE: src/integrations/metahub/db/types/products.ts
// =============================================================

export type ProductReviewRow = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductFaqRow = {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductStockRow = {
  id: string;
  product_id: string;
  stock_content: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  order_item_id: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description?: string | null;
  category_id: string | null;

  price: number;
  original_price: number | null;

  image_url: string | null;
  gallery_urls?: string[] | null;
  features?: string[] | null;

  rating: number;
  review_count: number;

  sku?: string | null;
  stock_quantity: number;

  is_active: boolean;
  show_on_homepage: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  requires_shipping?: boolean;

  delivery_type?: "manual" | "auto_stock" | "file" | "api" | string | null;

  file_url?: string | null;
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;

  epin_game_id?: string | null;
  epin_product_id?: string | null;
  auto_delivery_enabled?: boolean;
  pre_order_enabled?: boolean;

  min_order?: number;
  max_order?: number;
  min_barem?: number;
  max_barem?: number;
  barem_step?: number;

  tax_type?: number;

  custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options?: { quantity: number; price: number }[] | null;

  badges?: Array<{ text: string; icon?: string | null; active: boolean }> | null;

  article_content?: string | null;
  article_enabled?: boolean;
  demo_url?: string | null;
  demo_embed_enabled?: boolean;
  demo_button_text?: string | null;

  created_at: string;
  updated_at?: string;

  categories?: { id: string; name: string; slug: string };
};

export type ProductView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  cost: string | number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  features: string[] | null;
  rating: number;
  review_count: number;
  product_type?: string | null;
  delivery_type?: string | null;
  custom_fields?: Array<{
    id: string;
    label: string;
    type: "text" | "email" | "phone" | "url" | "textarea";
    placeholder?: string | null;
    required: boolean;
  }> | null;
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
