// =============================================================
// FILE: src/integrations/metahub/db/types/blog.ts
// =============================================================

// ---------- API (BE raw) ----------
export type ApiBlogPost = {
  id: string;

  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;

  // Görsel alanları (yeni + eski)
  featured_image?: string | null;            // URL (legacy)
  featured_image_asset_id?: string | null;   // storage id (yeni)
  featured_image_alt?: string | null;        // alt text (yeni)

  author?: string | null;

  is_published?: boolean | 0 | 1 | "0" | "1" | "true" | "false";

  created_at?: string | number | Date;
  updated_at?: string | number | Date;
  published_at?: string | number | Date | null;

  // --- Legacy/FE-only alanlar (projede başka yerlerde kullanılıyorsa bozmasın diye opsiyonel bırakıldı)
  category?: string | null;
  read_time?: string | null;
  is_featured?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  display_order?: number | string | null;
};

// ---------- FE normalized ----------
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;

  // FE adlandırma
  image_url: string | null;          // maps: featured_image
  image_asset_id: string | null;     // maps: featured_image_asset_id
  image_alt: string | null;          // maps: featured_image_alt

  author_name: string | null;        // maps: author

  is_published: boolean;

  created_at: string;
  updated_at: string;
  published_at: string | null;

  // türetilen/opsiyonel (isteğe bağlı olarak FE’de kullanılıyor olabilir)
  read_time?: string | null;

  // legacy alanlar (projede halen referans varsa kalsın)
  category?: string | null;
  is_featured?: boolean;
  display_order?: number;
};

// ---------- List/query params ----------
export type ListParams = {
  q?: string;
  is_published?: boolean | 0 | 1 | "0" | "1";
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "published_at" | "title";
  order?: "asc" | "desc";
  // legacy:
  category?: string;
};

// ---------- Admin upsert body (FE -> BE map edilecek) ----------
export type UpsertBlogBody = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;

  // FE alan adları
  image_url?: string | null;        // legacy URL
  image_asset_id?: string | null;   // storage id (yeni)
  image_alt?: string | null;

  author_name?: string | null;
  is_published?: boolean;

  // legacy:
  category?: string | null;
  is_featured?: boolean;
  display_order?: number;
};
