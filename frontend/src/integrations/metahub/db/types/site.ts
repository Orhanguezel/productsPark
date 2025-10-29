// =============================================================
// FILE: src/integrations/metahub/db/types/site.ts
// =============================================================

export type ValueType = "string" | "number" | "boolean" | "json";

export type SettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | null;

export type SiteSettingRow = {
  id?: string;                 // opsiyonel; bazı BE'lerde olmayabilir
  key: string;
  value: unknown;              // ham değer, normalizer bunu SettingValue'ya indirger
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TopbarSettingRow = {
  id: string;
  is_active: boolean | 0 | 1;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

// Email template tablosu FE’de "any" idi — tipe alalım
export type EmailTemplateRow = {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string;         // HTML (quill)
  variables: string[];     // ['user_name','site_name',...]
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

