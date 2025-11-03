// =============================================================
// FILE: src/integrations/metahub/db/types/categories.ts
// =============================================================

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  icon: string | null;
  parent_id: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  seo_title?: string | null;
  seo_description?: string | null;

  article_enabled?: boolean | null;
  article_content?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type ApiCategory = Omit<
  Category,
  "is_active" | "is_featured" | "display_order" | "article_enabled"
> & {
  is_active: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_featured: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order: number | string;
  article_enabled?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  image_asset_id?: string | null;
  image_alt?: string | null;

  /** BE uyumluluğu için olası alternatif alan adları */
  meta_title?: string | null;
  meta_description?: string | null;
  category_slug?: string | null;
  url_slug?: string | null;
};

export type UpsertCategoryBody = {
  name: string;
  slug: string;
  description?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  icon?: string | null;
  parent_id?: string | null;

  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;

  seo_title?: string | null;
  seo_description?: string | null;

  // BE uyumu için opsiyonel kopyalar (isteklerde withCompat zaten ekliyor)
  meta_title?: string | null;
  meta_description?: string | null;

  article_enabled?: boolean | null;
  article_content?: string | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  icon: string | null;
  parent_id: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  created_at?: string;
  updated_at?: string;

  article_content?: string | null;
  article_enabled?: boolean;

  // BE bazı projelerde meta_* kullanıyor
  meta_title?: string | null;
  meta_description?: string | null;
  banner_image_url?: string | null;
};
