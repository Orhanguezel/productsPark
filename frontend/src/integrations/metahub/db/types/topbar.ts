// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/db/types/topbar.ts
// ----------------------------------------------------------------------

export type BoolLike = 0 | 1 | boolean | "0" | "1" | "true" | "false";

/** FE'de kullanılacak normalize edilmiş topbar modeli */
export type TopbarSetting = {
  id: string;
  is_active: boolean;
  message: string;

  // Eski alan, bazı projelerde sadece kod dönebilir
  coupon_code?: string | null;

  // Yeni ilişki: kuponu ID ile seçiyoruz
  coupon_id?: string | null;

  // Kupon detayları (public endpoint'ten gelebilir)
  coupon_title?: string | null;
  coupon_content_html?: string | null;

  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Public (GET /topbar_settings) response satırı */
export type ApiTopbarSetting = {
  id: string;

  is_active?: BoolLike;
  // BE bazı eski projelerde "text" döner, burada "message" olarak normalize ediyoruz
  message?: string | null;

  // Eski alanlar:
  coupon_code?: string | null;

  // Yeni ilişki:
  coupon_id?: string | null;

  // Kupon içeriği (public controller join ile dönebilir)
  coupon_title?: string | null;
  coupon_content_html?: string | null;

  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: BoolLike;
  created_at?: string;
  updated_at?: string;
};

/** Admin (GET /admin/topbar_settings) response satırı */
export type ApiTopbarAdminRow = {
  id: string;
  text: string;
  link: string | null;
  coupon_id?: string | null;
  // İleride join ile geri dönmek istersek hazır:
  coupon_code?: string | null;
  is_active: BoolLike;
  show_ticker: BoolLike;
  created_at?: string;
  updated_at?: string;
};

/** Public listeleme parametreleri (FE tarafı) */
export type TopbarPublicListParams = {
  is_active?: boolean;
  // FE'de sadece yön veriyoruz; BE'de created_at.[asc|desc]'e maplenecek
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** Admin listeleme parametreleri (FE tarafı) */
export type AdminTopbarListParams = {
  q?: string;
  is_active?: boolean;
  // FE'de "message" kullanıyoruz, BE'de "text" string'ine maplenecek
  sort?: "created_at" | "updated_at" | "message" | "is_active";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** Admin create/update body (FE tarafı) */
export type UpsertTopbarBody = {
  message: string;
  is_active?: boolean;      // default: false (BE boolLike)
  // Eski: coupon_code (şu an BE doğrudan kullanmıyor ama reserved)
  coupon_code?: string | null;
  // Yeni: kuponu ID ile seçiyoruz
  coupon_id?: string | null;

  link_url?: string | null;
  link_text?: string | null; // BE direkt kullanmıyor, FE UI için
  show_ticker?: boolean;     // default: false
};
