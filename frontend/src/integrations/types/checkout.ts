// =============================================================
// FILE: src/integrations/types/checkout.ts
// FINAL — Checkout UI types (dynamic, backend-driven)
// =============================================================

/**
 * Checkout UI payment method id
 * - MUST match backend provider.key
 * - Examples:
 *   - "bank_transfer"
 *   - "paytr"
 *   - "shopier"
 *   - "wallet"
 *   - "paytr_v2"
 */
export type CheckoutPaymentMethodId = string;

/**
 * Checkout UI payment option (render model)
 */
export type CheckoutPaymentMethodOption = {
  id: CheckoutPaymentMethodId; // provider key
  name: string;
  enabled: boolean;

  /** Commission percentage (e.g. 2.5 for 2.5%) */
  commission?: number;

  // bank_transfer only (optional UI hints)
  iban?: string;
  account_holder?: string;
  bank_name?: string;
};
