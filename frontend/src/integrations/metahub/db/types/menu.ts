// =============================================================
// FILE: src/integrations/metahub/db/types/menu.ts
// =============================================================

export type BoolLike = 0 | 1 | boolean | "0" | "1" | "true" | "false";

/** PUBLIC satır tipi (BE mapRow ile birebir) */
export type MenuItemRow = {
  id: string;
  title: string;
  url: string;
  section_id: string | null;
  icon: string | null;

  // opsiyoneller
  href?: string | null;
  slug?: string | null;
  parent_id: string | null;
  position?: number | null;
  order_num?: number | null;
  location?: "header" | "footer" | null; // public BE'de şimdilik yok; null
  is_active: boolean;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

/** PUBLIC list query params (BE: /menu_items?...) */
export type MenuPublicListParams = {
  // BE 'order' -> "display_order" | "position" | "order_num" | "created_at" | "updated_at"[.desc]
  order?:
    | "display_order"
    | "display_order.desc"
    | "position"
    | "position.desc"
    | "order_num"
    | "order_num.desc"
    | "created_at"
    | "created_at.desc"
    | "updated_at"
    | "updated_at.desc";
  is_active?: BoolLike;        // yoksa BE default true
  parent_id?: string | null;
  limit?: number;
  offset?: number;

  // FE bazen gönderiyor ama BE yoksayıyor:
  locale?: string;
  select?: string;
  location?: string;
  section_id?: string | null;
};

/** ADMIN ham DTO (BE admin mapRowToAdmin ile birebir) */
export type ApiMenuItemAdmin = {
  id: string;
  title: string;
  url: string | null;
  type: "page" | "custom";     // BE şimdilik "custom"
  page_id: string | null;      // null
  parent_id: string | null;
  location: "header" | "footer";
  icon: string | null;
  section_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

/** FE normalize — merkez tip + admin ek alanları */
export type MenuItemAdmin = MenuItemRow & {
  type: "page" | "custom";
  page_id: string | null;
  display_order: number;
  location: "header" | "footer";
};

/** List filters (admin) */
export type MenuAdminListParams = {
  q?: string;
  location?: "header" | "footer";
  section_id?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "created_at" | "title";
  order?: "asc" | "desc";
};

/** Upsert FE body (admin) */
export type UpsertMenuItemBody = {
  title: string;
  url: string; // merkezde string tutuyoruz; BE'de boş string kabul
  type: "page" | "custom";
  page_id?: string | null;
  parent_id?: string | null;
  location: "header" | "footer";
  icon?: string | null;
  section_id?: string | null;
  is_active?: boolean;
  display_order?: number;
};
