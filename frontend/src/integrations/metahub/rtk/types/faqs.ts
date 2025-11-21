// src/integrations/metahub/db/types/faqs.ts


export interface Faq {
  id: string;
  question: string;
  answer: string;
  slug: string;
  category?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export type FaqListParams = {
  search?: string;
  category?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "updated_at" | "display_order";
  order?: "asc" | "desc";
};
