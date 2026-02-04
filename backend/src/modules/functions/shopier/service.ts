// ===================================================================
// FILE: src/modules/functions/shopier/service.ts
// FINAL — Shopier REAL form generator (api_pay4.php) + signature
// - Reads config via getShopierConfig('shopier')
// - Produces { form_action, form_data } for FE to POST
// Fixes:
// - ✅ strict config validation (apiKey/secret/websiteIndex)
// - ✅ crypto-based random_nr
// ===================================================================

import crypto from 'crypto';
import { getShopierConfig } from '@/modules/payments/service';

export type ShopierCurrency = 'TRY' | 'TL' | 'USD' | 'EUR';

export type ShopierCreateBody = {
  platform_order_id: string;
  total_order_value: string | number; // "100.00"

  currency?: ShopierCurrency;

  product_name?: string;
  product_type?: 0 | 1; // 1 digital

  buyer_name?: string;
  buyer_surname?: string;
  buyer_email?: string;
  buyer_phone?: string;

  buyer_account_age?: string | number;
  buyer_id_nr?: string;

  billing_address?: string;
  billing_city?: string;
  billing_country?: string;
  billing_postcode?: string;

  shipping_address?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_postcode?: string;

  is_in_frame?: 0 | 1;
  current_language?: 0 | 1; // 0 tr, 1 en
};

export type ShopierFormResult = {
  form_action: string;
  form_data: Record<string, string | number>;
};

export const SHOPIER_FORM_ACTION = 'https://www.shopier.com/ShowProduct/api_pay4.php';

function normalizeMoney(v: unknown): string {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? Number(v.replace(',', '.').trim())
        : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function toShopierCurrencyCode(cur: ShopierCurrency | undefined): 0 | 1 | 2 {
  const c = String(cur ?? 'TRY')
    .toUpperCase()
    .trim();
  if (c === 'USD') return 1;
  if (c === 'EUR') return 2;
  return 0; // TRY/TL
}

function mustStr(v: unknown, key: string): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) throw new Error(`shopier_config_missing_${key}`);
  return s;
}

function mustInt(v: unknown, key: string, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (Number.isFinite(n)) return Math.trunc(n);
  if (fallback != null) return fallback;
  throw new Error(`shopier_config_missing_${key}`);
}

function randNumeric(len = 6) {
  // ✅ crypto random
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += String(bytes[i] % 10);
  return out;
}

function hmacBase64(secret: string, data: string) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
}

export async function createShopierForm(body: ShopierCreateBody): Promise<ShopierFormResult> {
  const cfg = await getShopierConfig('shopier');

  const apiKey = mustStr((cfg as any).apiKey, 'api_key');
  const secret = mustStr((cfg as any).secret, 'secret');
  const websiteIndex = mustInt((cfg as any).websiteIndex, 'website_index', 1);

  const platform_order_id = String(body.platform_order_id || '').trim();
  if (!platform_order_id) throw new Error('shopier_platform_order_id_missing');

  const total_order_value = normalizeMoney(body.total_order_value);
  const currencyCode = toShopierCurrencyCode(body.currency);

  const random_nr = randNumeric(6);

  // signature = base64(hmac_sha256(secret, random_nr + platform_order_id + total_order_value + currencyCode))
  const dataToSign = `${random_nr}${platform_order_id}${total_order_value}${currencyCode}`;
  const signature = hmacBase64(secret, dataToSign);

  const form_data: Record<string, string | number> = {
    API_key: apiKey,
    website_index: websiteIndex,
    platform_order_id,

    product_name: String(body.product_name || 'Wallet Topup'),
    product_type: body.product_type ?? 1,

    buyer_name: String(body.buyer_name || 'Guest'),
    buyer_surname: String(body.buyer_surname || 'User'),
    buyer_email: String(body.buyer_email || 'guest@example.com'),
    buyer_phone: String(body.buyer_phone || '0000000000'),
    buyer_account_age: String(body.buyer_account_age ?? '0'),
    buyer_id_nr: String(body.buyer_id_nr || '0'),

    billing_address: String(body.billing_address || 'N/A'),
    billing_city: String(body.billing_city || 'N/A'),
    billing_country: String(body.billing_country || 'TR'),
    billing_postcode: String(body.billing_postcode || '00000'),

    shipping_address: String(body.shipping_address || 'N/A'),
    shipping_city: String(body.shipping_city || 'N/A'),
    shipping_country: String(body.shipping_country || 'TR'),
    shipping_postcode: String(body.shipping_postcode || '00000'),

    total_order_value,
    currency: currencyCode,

    platform: 0,
    is_in_frame: body.is_in_frame ?? 0,
    current_language: body.current_language ?? 0,
    modul_version: '1.0.0',

    random_nr,
    signature,
  };

  return {
    form_action: SHOPIER_FORM_ACTION,
    form_data,
  };
}
