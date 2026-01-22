// ===================================================================
// FILE: src/modules/payments/types.ts
// FINAL — Payments module types (public + admin DTO compatibility)
// - Adds: PaymentProviderType, PublicPaymentMethod, PublicPaymentMethodsResp
// - Fix: admin_note (singular) (keeps admin_notes as backward-compat optional)
// ===================================================================

export type PaymentProviderKey = 'stripe' | 'paytr' | 'iyzico' | 'bank_transfer' | string;

export type PaymentProviderType = 'card' | 'bank_transfer' | 'wallet' | 'manual';

export type PaymentProvider = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;
  public_config: Record<string, unknown> | null;
};

/**
 * Checkout için tek endpoint dönüşü:
 * GET /public/payment-methods
 */
export type PublicPaymentMethod = {
  key: PaymentProviderKey;
  display_name: string;

  /** UI decision */
  type: PaymentProviderType;

  /** provider active flag */
  enabled: boolean;

  /** provider public_config (parsed object) */
  config: Record<string, unknown> | null;

  /** optional commission (percentage) */
  commission_rate?: number;
};

export type PublicPaymentMethodsResp = {
  currency: string;
  guest_order_enabled: boolean;
  methods: PublicPaymentMethod[];
};

export type PaymentRequestStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'approved';

export type ApiPaymentRequest = {
  id: string;
  order_id: string;
  user_id?: string | null;

  amount: number;
  currency: string;

  /**
   * Option-2: payment_method = provider_key
   * e.g. 'paytr' | 'bank_transfer'
   */
  payment_method: string;

  proof_image_url?: string | null;

  status: PaymentRequestStatus;

  /**
   * FINAL: singular (new API)
   */
  admin_note?: string | null;

  /**
   * Backward-compat: older clients may still expect admin_notes
   * (keep optional to avoid breaking FE)
   */
  admin_notes?: string | null;

  processed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PaymentSessionStatus =
  | 'requires_action'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'cancelled'
  | 'failed'
  | 'succeeded';

export type PaymentSession = {
  id: string;
  provider_key: string;
  order_id?: string | null;

  amount: number;
  currency: string;

  status: PaymentSessionStatus;

  client_secret?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;

  extra?: Record<string, unknown> | null;

  created_at?: string;
  updated_at?: string;
};
