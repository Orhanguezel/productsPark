// =============================================================
// FILE: src/integrations/metahub/db/types/popup.ts
// =============================================================

type BoolLike4 = 0 | 1 | boolean;

export type UnknownRow = Record<string, unknown>;

export type PopupType = "modal" | "drawer" | "banner" | "toast";
export type DisplayFrequency = "always" | "once" | "daily" | "weekly";

/** Public popup (FE’de gösterim) */
export type Popup = {
  id: string;
  key?: string | null;
  title?: string | null;
  type: PopupType;
  content_html?: string | null;
  options?: Record<string, unknown> | null; // JSON-string possible
  is_active?: BoolLike4;
  start_at?: string | null;
  end_at?: string | null;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;

  // Yeni: görsel alanları (public API bunları da dönebiliyor)
  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;
};

/** Admin form/list görünümü */
export type PopupAdminView = {
  id: string;
  title: string;
  content: string;

  // Görsel alanları (legacy + storage)
  image_url: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  button_text: string | null;
  button_link: string | null;
  is_active: boolean;

  display_frequency: DisplayFrequency;
  delay_seconds: number;

  start_date: string | null; // ISO
  end_date: string | null;   // ISO

  // UI'de görünen ama DB'de olmayan alanlar:
  product_id: string | null;
  coupon_code: string | null;
  display_pages: string; // "all" default
  priority: number | null;
  duration_seconds: number | null;

  created_at?: string;
  updated_at?: string;
};
