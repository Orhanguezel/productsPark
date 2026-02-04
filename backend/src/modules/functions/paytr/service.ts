// ===================================================================
// FILE: src/modules/functions/paytr/service.ts
// FINAL — PayTR REAL iframe token service [FIXED]
// Fixes:
// - Basket normalization: accepts unit price in KURUŞ (int) OR TL (decimal string)
//   FE currently sends KURUŞ -> backend now converts to TL string for PayTR.
// - Correct param name: installment_count (instead of installment)
// - Adds common required params: debug_on, non_3d
// - More informative error parsing (err_no/reason)
// ===================================================================

import crypto from 'crypto';
import { getPaytrConfig, type PaytrProviderConfig } from '@/modules/payments/service';

export type PaytrBody = {
  email?: string;
  user_ip?: string;
  merchant_oid?: string;

  payment_amount?: number | string; // KURUŞ (int)
  currency?: 'TL' | 'USD' | 'EUR';

  // FE currently sends: [name, unit_price_kurus, qty]
  // We'll support BOTH:
  // - unit_price in kuruş (number or numeric string)
  // - unit_price in TL decimal ("100.00")
  basket?: Array<[string, number | string, number | string]>;
  lang?: 'tr' | 'en';

  installment?: number | string; // we'll map -> installment_count
  no_installment?: number | string;
  max_installment?: number | string;

  user_name?: string;
  user_address?: string;
  user_phone?: string;

  timeout_limit?: number | string; // minutes
};

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toStr(v: unknown, fallback = ''): string {
  const s = typeof v === 'string' ? v : String(v ?? '');
  const t = s.trim();
  return t.length ? t : fallback;
}

function toFormUrlEncoded(obj: Record<string, string | number>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.set(k, String(v));
  return p.toString();
}

/**
 * Normalize unit price:
 * - If contains '.' or ',' -> treat as TL decimal
 * - Else numeric -> treat as KURUŞ and convert to TL ( /100 )
 */
function normalizeUnitToTlString(unit: unknown): string {
  if (typeof unit === 'string') {
    const s = unit.trim();
    if (!s) return '0.00';

    // decimal TL
    if (s.includes('.') || s.includes(',')) {
      const n = Number(s.replace(',', '.'));
      return Number.isFinite(n) ? n.toFixed(2) : '0.00';
    }

    // integer string -> assume KURUŞ
    const n = Number(s);
    if (!Number.isFinite(n)) return '0.00';
    return (Math.trunc(n) / 100).toFixed(2);
  }

  if (typeof unit === 'number' && Number.isFinite(unit)) {
    // number -> assume KURUŞ (FE uses Math.round(amount*100))
    return (Math.trunc(unit) / 100).toFixed(2);
  }

  // fallback parse
  const n = Number(String(unit ?? '').trim());
  if (!Number.isFinite(n)) return '0.00';
  return (Math.trunc(n) / 100).toFixed(2);
}

function normalizeBasket(basket: PaytrBody['basket']): Array<[string, string, number]> {
  const arr = Array.isArray(basket) ? basket : [];
  return arr
    .map((x) => {
      const name = toStr(x?.[0], '');
      const unitTl = normalizeUnitToTlString(x?.[1]);
      const qty = toInt(x?.[2], 1);
      return [name, unitTl, qty] as [string, string, number];
    })
    .filter((x) => x[0] && x[2] > 0);
}

export type PaytrTokenResult = {
  token: string;
  iframe_url: string;
  forward_payload: Record<string, string | number>;
  expires_in: number;
};

function buildPaytrHmac(body: PaytrBody, cfg: PaytrProviderConfig) {
  const merchant_id = cfg.merchantId;
  const merchant_key = cfg.merchantKey;
  const merchant_salt = cfg.merchantSalt;

  const email = toStr(body.email, '');
  const user_ip = toStr(body.user_ip, '127.0.0.1');
  const merchant_oid = toStr(body.merchant_oid, `OID_${Date.now()}`);

  // payment_amount MUST be integer KURUŞ
  const payment_amount = toInt(body.payment_amount, 0);

  const no_installment = toInt(body.no_installment, 1);
  const max_installment = toInt(body.max_installment, 0);

  // PayTR name commonly installment_count
  const installment_count = toInt(body.installment, 0);

  const currency = (body.currency ?? 'TL') as string;
  const test_mode = cfg.testMode; // 0/1

  const user_basket = b64(JSON.stringify(normalizeBasket(body.basket)));

  // PayTR hash pattern for get-token:
  const hash_str =
    `${merchant_id}${user_ip}${merchant_oid}${email}` +
    `${payment_amount}${user_basket}${no_installment}${max_installment}` +
    `${currency}${test_mode}`;

  const paytr_token = crypto
    .createHmac('sha256', merchant_key)
    .update(hash_str + merchant_salt, 'utf8')
    .digest('base64');

  return {
    merchant_id,
    email,
    user_ip,
    merchant_oid,
    payment_amount,
    currency,
    test_mode,
    user_basket,
    no_installment,
    max_installment,
    installment_count,
    paytr_token,
    lang: (body.lang ?? 'tr') as string,
  };
}

/**
 * REAL token creator:
 * - calls PayTR API and returns iframe token
 */
export async function createPaytrToken(body: PaytrBody): Promise<PaytrTokenResult> {
  const cfg = await getPaytrConfig('paytr');

  // getPaytrConfig already enforces these, but keep explicit:
  if (!cfg.merchantId || !cfg.merchantKey || !cfg.merchantSalt) {
    throw new Error('paytr_config_missing');
  }

  const built = buildPaytrHmac(body || {}, cfg);

  // Often required (even in test)
  const user_name = toStr(body.user_name, 'Guest');
  const user_address = toStr(body.user_address, 'N/A');
  const user_phone = toStr(body.user_phone, '0000000000');

  const timeout_limit = toInt(body.timeout_limit, 30);

  // Common optional but useful flags
  const debug_on = 1;
  const non_3d = 0;

  const forward_payload: Record<string, string | number> = {
    merchant_id: built.merchant_id,
    user_ip: built.user_ip,
    merchant_oid: built.merchant_oid,
    email: built.email,
    payment_amount: built.payment_amount,

    user_basket: built.user_basket,

    no_installment: built.no_installment,
    max_installment: built.max_installment,
    installment_count: built.installment_count, // ✅ correct name

    currency: built.currency,
    test_mode: built.test_mode,

    paytr_token: built.paytr_token,

    merchant_ok_url: cfg.okUrl,
    merchant_fail_url: cfg.failUrl,

    lang: built.lang,

    user_name,
    user_address,
    user_phone,

    timeout_limit,
    debug_on,
    non_3d,
  };

  if (typeof fetch !== 'function') {
    throw new Error('paytr_fetch_missing_node_runtime');
  }

  let resp: Response;
  let rawText = '';
  try {
    resp = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: toFormUrlEncoded(forward_payload),
    });
    rawText = await resp.text();
  } catch (err: any) {
    throw new Error(`paytr_network_failed:${err?.message || 'unknown'}`);
  }

  let raw: any = null;
  try {
    raw = rawText ? JSON.parse(rawText) : null;
  } catch {
    raw = null;
  }

  if (!resp.ok) {
    throw new Error(`paytr_http_${resp.status}`);
  }

  if (!raw || raw?.status !== 'success' || !raw?.token) {
    const reason = typeof raw?.reason === 'string' ? raw.reason : 'unknown';
    const errNo = raw?.err_no != null ? String(raw.err_no) : '';
    throw new Error(`paytr_failed:${errNo}:${reason}`);
  }

  const token = String(raw.token).trim();
  if (!token) throw new Error('paytr_token_empty');

  return {
    token,
    iframe_url: `https://www.paytr.com/odeme/guvenli/${encodeURIComponent(token)}`,
    forward_payload,
    expires_in: 300,
  };
}
