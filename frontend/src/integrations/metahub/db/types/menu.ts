// =============================================================
// FILE: src/integrations/metahub/db/types/menu.ts
// =============================================================

export type MenuItemRow = {
  id: string;
  title: string;
  url: string;                 // FE kesin bekler
  section_id: string | null;
  icon: string | null;

  // opsiyoneller
  href?: string | null;
  slug?: string | null;
  parent_id: string | null;
  position?: number | null;
  order_num?: number | null;
  location?: "header" | "footer" | null;
  is_active: boolean;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};
