export type PaymentProviderKey = 'stripe' | 'paytr' | 'iyzico' | string;

export type PaymentProvider = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;
  public_config: Record<string, unknown> | null;
};

export type PaymentRequestStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'approved';

export type ApiPaymentRequest = {
  id: string;
  order_id: string;
  user_id?: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  proof_image_url?: string | null;
  status: PaymentRequestStatus;
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
