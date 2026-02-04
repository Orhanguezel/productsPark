// =============================================================
// FILE: src/integrations/types/functions.ts
// FINAL — Functions (cloud/functions) types
// =============================================================

import type { TurkpinListType } from '@/integrations/types';

/* ---------------- Common responses ---------------- */

export type SimpleSuccessResp = {
  success: boolean;
  error?: string;
};

export type BalanceResult = {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
};

/* ---------------- PayTR ---------------- */

export type PaytrTokenBody = {
  email?: string;
  payment_amount?: number | string; // kuruş
  merchant_oid?: string;
  user_ip?: string;
  installment?: number | string;
  no_installment?: number | string;
  max_installment?: number | string;
  currency?: string; // 'TL'
  basket?: Array<[string, number, number]>; // [name, unit_price, qty]
  lang?: string; // 'tr', 'en'
};

/**
 * PayTR token result:
 * Backend farklı alan isimleri döndürebilir (tolerant).
 * FE sadece token + varsa redirect/iframe/url alanlarını kullanır.
 */
export type PaytrTokenResult = {
  success: boolean;

  token?: string; // primary
  paytr_token?: string; // legacy
  iframe_url?: string;
  redirect_url?: string;

  error?: string;
  message?: string;

  [key: string]: unknown;
};

/* ---------------- Shopier ---------------- */

export type ShopierPaymentFormResult = {
  success: boolean;

  // Çoğu Shopier entegrasyonu HTML form döndürür:
  form?: string;
  html?: string;

  // bazen doğrudan redirect URL:
  redirect_url?: string;

  [key: string]: unknown;
  message?: string;
  error?: string;

  form_action?: string | null;
  form_data?: Record<string, string | number> | null;
};

/* ---------------- Email / Telegram ---------------- */

export type SendEmailBody = {
  to: string;

  // klasik
  subject?: string;
  html?: string;
  text?: string;

  // template
  template_key?: string;
  variables?: Record<string, unknown>;
};

export type ManualDeliveryEmailBody = {
  to: string;
  customer_name?: string;
  order_number?: string;
  delivery_content: string;
  site_name?: string;
};

export type TelegramNotificationBody = Record<string, unknown>;

/* ---------------- SMM ---------------- */

export type SmmApiOrderBody = Record<string, unknown>;
export type SmmApiStatusBody = Record<string, unknown>;

export type SmmApiOrderResp = {
  success: boolean;
  order_id: string;
  status: string;
  error?: string;
  message?: string;
};

export type SmmApiStatusResp = {
  success: boolean;
  status: string;
  error?: string;
  message?: string;
};

/* ---------------- Turkpin ---------------- */

export type TurkpinCreateOrderBody = Record<string, unknown>;

export type TurkpinCreateOrderResp = {
  success: boolean;
  order_id: string;
  status: string;
  error?: string;
  message?: string;
};

export type TurkpinGameListBody = {
  providerId: string;
  listType: TurkpinListType;
};

export type TurkpinProductListBody = {
  providerId: string;
  gameId: string;
  listType: TurkpinListType;
};

export type TurkpinBalanceBody = {
  providerId: string;
};

/* ---------------- Maintenance / misc ---------------- */

export type DeleteUserOrdersBody = {
  email: string;
};

export type DeleteUserOrdersResp = {
  success: boolean;
  message?: string;
  error?: string;
};


/* ---------------- Shopier ---------------- */

export type ShopierCallbackBody = {
  platform_order_id: string;
  status: string;
  payment_id: string;
  signature: string;

  random_nr?: string | null;
  API_key?: string | null;
};


export type SendTestMailBody = {
  to?: string;
};

export type SendTestMailResp = {
  ok: boolean;
  message?: string;
};


export type TelegramSendTestBody = {
  bot_token: string;
  chat_id: string;
  message: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
};

export type TelegramSendTestResp = {
  ok: boolean;
  message?: string;
};
