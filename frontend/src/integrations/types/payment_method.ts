// ===================================================================
// FILE: src/integrations/types/payment_method.ts
// FINAL — Public payment methods (GET /public/payment-methods)
// - Exported via "@/integrations/types" barrel
// ===================================================================

/** Provider "type" reported to UI (normalized) */
export type PaymentProviderType = 'wallet' | 'bank_transfer' | 'card' | 'manual';

/** Single payment method returned from public endpoint */
export type PublicPaymentMethod = {
  key: string; // provider key, e.g. 'paytr', 'shopier', 'bank_transfer'
  display_name: string; // UI label
  type: PaymentProviderType; // payment method type
  enabled: boolean; // active or not
  commission_rate?: number; // optional, percent (e.g. 2.5)
  config: Record<string, unknown> | null; // provider public_config (parsed)
};

/** Response of GET /public/payment-methods */
export type PublicPaymentMethodsResp = {
  currency: string; // e.g. 'TRY'
  guest_order_enabled: boolean;
  methods: PublicPaymentMethod[];
};
