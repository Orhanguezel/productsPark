export type UnknownRow = Record<string, unknown>;

export type DiscountType = "percentage" | "fixed";

/** BE’den gelebilecek ham şekil (public/admin ikisini de kapsar) */
export type ApiCoupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type?: string | null;          // percentage/fixed vs.
  discount_value?: number | string;

  min_purchase?: number | string | null;
  max_discount?: number | string | null;

  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  usage_limit?: number | string | null;   // BE kolon adı
  max_uses?: number | string | null;      // FE eşanlam
  used_count?: number | string | null;

  valid_from?: string | Date | null;
  valid_until?: string | Date | null;
  valid_to?: string | Date | null;        // eski isim desteği

  applicable_to?: "all" | "category" | "product" | string | null;
  category_ids?: string | string[] | null;
  product_ids?: string | string[] | null;

  created_at?: string;
  updated_at?: string;
};

/** FE’nin normalize ettiği tip (public ve admin ortak kullanıyoruz) */
export type Coupon = {
  id: string;
  code: string;
  title?: string | null;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase: number;
  max_discount: number | null;

  is_active: boolean;
  max_uses: number | null;    // usage_limit -> max_uses
  used_count: number | null;

  valid_from: string | null;  // ISO
  valid_until: string | null; // ISO

  applicable_to?: "all" | "category" | "product";
  category_ids?: string[] | null;
  product_ids?: string[] | null;

  created_at?: string;
  updated_at?: string;
};
