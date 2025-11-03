// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/db/types/footer.ts
// ----------------------------------------------------------------------

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  /** Admin backend'e uygun sort alanları */
  sort?: "display_order" | "created_at" | "title";
  order?: "asc" | "desc";
};

export type FooterPublicListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc"; // public'te sort alanı yok; order_num yönü
};

export type ReorderFooterSectionItem = {
  id: string;
  display_order: number;
};

/** BE’den gelen ham kayıt (links string olabilir) */
export type ApiFooterSection = {
  id: string;
  title: string | null;
  links?: string | FooterLink[] | null;
  display_order?: number | null;
  is_active?: boolean | number | "0" | "1" | "true" | "false" | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** FE’de kullanılan normalize edilmiş model */
export type FooterSection = {
  id: string;
  title: string;
  links: FooterLink[];
  display_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Create/Update body (admin/public upsert) */
export type UpsertFooterSectionBody = {
  title: string;
  links?: FooterLink[];
  display_order?: number;
  is_active?: boolean;
};
