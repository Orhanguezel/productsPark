// =============================================================
// FILE: src/integrations/metahub/rtk/types/payments.ts
// =============================================================

/** ---------- Payments (records) ---------- */
export type PaymentStatus =
  | "requires_action"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "voided"
  | "failed";

export type PaymentRow = {
  id: string;
  order_id: string | null;
  provider: string;
  currency: string;
  amount_authorized: number;
  amount_captured: number;
  amount_refunded: number;
  fee_amount: number | null;
  status: PaymentStatus;
  reference: string | null;
  transaction_id: string | null;
  is_test: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;        // ISO
  updated_at: string | null; // ISO
};

export type ApiPaymentRow = Omit<
  PaymentRow,
  | "amount_authorized" | "amount_captured" | "amount_refunded" | "fee_amount"
  | "is_test" | "updated_at"
> & {
  amount_authorized: number | string;
  amount_captured: number | string;
  amount_refunded: number | string;
  fee_amount: number | string | null;
  is_test: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  updated_at: string | null;
};

/** ---------- Payment Events ---------- */
export type PaymentEventRow = {
  id: string;
  payment_id: string;
  event_type: "status_change" | "webhook" | "capture" | "refund" | "void" | "note" | "sync" | "error";
  message: string;
  raw?: Record<string, unknown> | null;
  created_at: string; // ISO
};
export type ApiPaymentEventRow = Omit<PaymentEventRow, never>;

/** ---------- Payment Providers ---------- */
export type PaymentProviderKey = "stripe" | "paytr" | "iyzico" | string;
export type PaymentProviderRow = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active?: 0 | 1 | boolean;
  public_config?: Record<string, unknown> | null;
  secret_config?: Record<string, unknown> | null; // admin görünür
  // Opsiyonel zaman damgaları (BE varsa kullansa da, yoksa sorun değil)
  created_at?: string;
  updated_at?: string | null;
};

/** ---------- Payment Requests ---------- */
export type PaymentRequestStatus = "pending" | "approved" | "paid" | "failed" | "cancelled" | "rejected";
export type PaymentRequestRow = {
  id: string;
  order_id?: string | null;
  user_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  admin_note?: string | null;
  created_at?: string;
  orders?: Record<string, unknown> | null;
};
export type ApiPaymentRequestRow = Omit<PaymentRequestRow, "amount"> & {
  amount: number | string;
};

/** ---------- Payment Sessions ---------- */
export type PaymentSessionStatus =
  | "requires_action"
  | "pending"
  | "authorized"
  | "captured"
  | "cancelled"
  | "failed"
  | "succeeded";

export type PaymentSessionRow = {
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

export type ApiPaymentSessionRow = Omit<PaymentSessionRow, "amount" | "extra"> & {
  amount: number | string;
  extra?: string | PaymentSessionRow["extra"];
};
