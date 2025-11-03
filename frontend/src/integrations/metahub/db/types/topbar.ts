// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/db/types/topbar.ts
// ----------------------------------------------------------------------

type BoolLike = 0 | 1 | boolean | "0" | "1" | "true" | "false";

export type TopbarSetting = {
  id: string;
  is_active: boolean;
  message: string;
  // 🔽 Eski alanı koruyoruz ama kullanmıyoruz
  coupon_code?: string | null;

  // 🔽 Yeni alan: BE/FE arası asıl anahtar
  coupon_id?: string | null;

  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ApiTopbarSetting = {
  id: string;
  is_active?: BoolLike;
  // BE bazı projelerde "text" dönebilir → normalize katmanı çözecek
  message?: string | null;
  // Eski alanlar:
  coupon_code?: string | null;

  // Yeni alan:
  coupon_id?: string | null;

  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: BoolLike;
  created_at?: string;
  updated_at?: string;
};

/** Public listeleme parametreleri */
export type TopbarPublicListParams = {
  is_active?: boolean;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** Admin listeleme parametreleri */
export type AdminTopbarListParams = {
  q?: string;
  is_active?: boolean;
  sort?: "created_at" | "updated_at" | "message" | "is_active";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** Admin create/update body (upsert) */
export type UpsertTopbarBody = {
  message: string;
  is_active?: boolean;      // default: true
  // Eski: coupon_code
  coupon_code?: string | null;
  // Yeni: kuponu ID ile seçiyoruz
  coupon_id?: string | null;

  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean;    // default: false
};
