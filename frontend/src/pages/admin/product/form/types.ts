// =============================================================
// FILE: src/components/admin/products/form/types.ts
// =============================================================
export type ReviewInput = {
  id?: string;
  customer_name: string;
  rating: number;
  comment: string;
  review_date: string;
  is_active: boolean | 0 | 1;
};

export type FAQInput = {
  id?: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean | 0 | 1;
};

export type CustomField = {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "url";
  placeholder: string;
  required: boolean;
};

export type Badge = {
  text: string;
  icon: "Zap" | "Shield" | "Clock" | "Headphones" | "Sparkles";
  active: boolean;
};

export type UploadedAsset = { id?: string; asset_id?: string; url: string; alt?: string | null };
