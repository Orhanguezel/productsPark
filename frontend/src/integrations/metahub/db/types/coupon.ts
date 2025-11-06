// src/integrations/metahub/db/types/coupon.ts

export type DiscountType = "percentage" | "fixed";

export type ApiCoupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type?: string | null;          // 'percentage' | 'fixed' | varyasyon
  discount_value?: number | string;

  min_purchase?: number | string | null;
  max_discount?: number | string | null;

  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  usage_limit?: number | string | null;
  max_uses?: number | string | null;
  used_count?: number | string | null;

  valid_from?: string | Date | null;
  valid_until?: string | Date | null;
  valid_to?: string | Date | null;        // eski alan desteği

  applicable_to?: "all" | "category" | "product" | string | null;
  category_ids?: string | string[] | null;
  product_ids?: string | string[] | null;

  // ⬇ BE bazen null dönebileceği için esnet
  created_at?: string | null;
  updated_at?: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase: number;
  max_discount: number | null;

  is_active: boolean;
  max_uses: number | null;
  used_count: number | null;

  valid_from: string | null;  // ISO
  valid_until: string | null; // ISO

  applicable_to?: "all" | "category" | "product";
  category_ids?: string[] | null;
  product_ids?: string[] | null;

  created_at?: string;
  updated_at?: string;
};
