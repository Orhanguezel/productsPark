/** Genel satır tipi */
export type UnknownRow = Record<string, unknown>;

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSectionView = {
  id: string;
  title: string;
  display_order: number;   // UI bekliyor
  is_active: boolean;      // kesin boolean
  locale?: string | null;
  links: FooterLink[];     // her zaman dizi (boş da olabilir)
  // opsiyoneller
  created_at?: string;
  updated_at?: string;
};