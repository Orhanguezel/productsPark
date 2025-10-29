// =============================================================
// FILE: src/integrations/metahub/db/types/content.ts
// =============================================================

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;       // HTML
  category: string;      // normalize: "Genel"
  author_name: string;   // DB: author
  created_at: string;
  image_url: string;     // DB: featured_image
  read_time: string;     // "X dk"
  is_published: boolean;
  is_featured: boolean;
  published_at?: string | null;
  updated_at?: string;
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionRow = {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type FooterSectionView = {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
  locale?: string | null;
  links: FooterLink[];
  created_at?: string;
  updated_at?: string;
};

/** ───── Custom Pages (RAW + VIEW) ───── */

export type CustomPageRow = {
  id: string;
  title: string;
  slug: string;
  /** DB iki şekilde tutabiliyor: content_html (string) ya da content (JSON/string) */
  content_html?: string | null;
  content?: unknown;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CustomPageView = {
  id: string;
  title: string;
  slug: string;
  content: string; // düz HTML
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

/** ───── Popup ───── */

export type PopupRow = {
  id: string;
  title: string | null;
  image_url: string | null;
  content?: string | null;
  content_html?: string | null;

  is_active: boolean;
  display_pages: "all" | "home" | "products" | "categories" | string;
  display_frequency: "always" | "once" | "daily" | "weekly" | string;
  delay_seconds: number | null;
  duration_seconds: number | null;
  priority: number | null;

  coupon_code: string | null;
  button_text: string | null;
  button_link: string | null;

  product_id?: string | null;
  products?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price: number;
    original_price: number | null;
  };

  key?: string | null;
  type?: string | null;
  options?: unknown;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};
