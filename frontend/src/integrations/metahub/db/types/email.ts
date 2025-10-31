// =============================================================
// FILE: src/integrations/metahub/db/types/email.ts
// =============================================================

export type BoolLike = boolean | 0 | 1 | "0" | "1" | "true" | "false";

export type EmailTemplateRow = {
  id: string;
  template_key: string;     // BE anahtar adı
  template_name: string;    // İnsan-okur adı
  subject: string;
  content?: unknown;        // HTML string veya farklı form
  body_html?: string | null; // Bazı BE'ler bu adı kullanabilir
  variables?: unknown;      // string[] | string (comma) | JSON-string | null
  is_active: BoolLike;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplateView = {
  id: string;
  key: string;
  name: string;
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
};
