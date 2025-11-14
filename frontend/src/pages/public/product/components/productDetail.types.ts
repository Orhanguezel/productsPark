// =============================================================
// FILE: src/pages/public/productDetail.types.ts
// =============================================================

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface CustomField {
  id: string;
  label: string;
  type: string; // "text" | "email" | "phone" | "url" | "textarea" | ...
  placeholder: string;
  required: boolean;
}

export interface QuantityOption {
  quantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  rating: number;
  review_count: number;
  features: string[] | null;
  custom_fields?: CustomField[];
  quantity_options?: QuantityOption[] | null;
  product_type?: string;
  delivery_type?: string;
  demo_url?: string | null;
  demo_embed_enabled?: boolean;
  demo_button_text?: string | null;
  article_content?: string | null;
  article_enabled?: boolean;
  badges?: Array<{ text: string; icon: string; active: boolean }>;
  categories?: {
    id: string;
    name: string;
  };
}
