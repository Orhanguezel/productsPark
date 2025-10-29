// =============================================================
// FILE: src/integrations/metahub/db/types/categories.ts
// =============================================================

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;    // normalized
  is_featured: boolean;  // normalized
  display_order: number;
  created_at?: string;
  updated_at?: string;

  // FE-only convenience
  article_content?: string | null;
  article_enabled?: boolean;

  // SEO / Banner
  meta_title?: string | null;
  meta_description?: string | null;
  banner_image_url?: string | null;
};
