// =============================================================
// FILE: src/pages/public/components/types.ts
// =============================================================

export interface CheckoutData {
  cartItems: any[];
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: any;
  notes?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  iban?: string;
  account_holder?: string;
  bank_name?: string;
}
