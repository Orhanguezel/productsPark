// ===================================================================
// FILE: src/modules/functions/paytr/status.ts
// PayTR Mağaza Durum Sorgulama API
// POST https://www.paytr.com/odeme/durum-sorgu
// Hash: base64(hmac_sha256(merchant_id + merchant_oid + merchant_salt, merchant_key))
// ===================================================================

import crypto from 'crypto';
import { getPaytrConfig } from '@/modules/payments/service';

export type PaytrStatusResult = {
  status: 'success' | 'error' | 'waiting' | 'failed';
  payment_status?: string;   // PayTR ödeme durumu
  merchant_oid?: string;
  total_amount?: string;     // kuruş cinsinden toplam tutar
  currency?: string;
  payment_type?: string;
  installment_count?: number;
  err_no?: string;
  err_msg?: string;
};

function toFormUrlEncoded(obj: Record<string, string>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.set(k, v);
  return p.toString();
}

export async function queryPaytrStatus(merchant_oid: string): Promise<PaytrStatusResult> {
  if (!merchant_oid?.trim()) throw new Error('paytr_status_missing_merchant_oid');

  const cfg = await getPaytrConfig('paytr');

  const merchant_id = cfg.merchantId;
  const merchant_key = cfg.merchantKey;
  const merchant_salt = cfg.merchantSalt;
  const oid = merchant_oid.trim();

  // Hash: base64(hmac_sha256(merchant_id + merchant_oid + merchant_salt, merchant_key))
  const hashStr = `${merchant_id}${oid}${merchant_salt}`;
  const paytr_token = crypto
    .createHmac('sha256', merchant_key)
    .update(hashStr, 'utf8')
    .digest('base64');

  const postBody: Record<string, string> = {
    merchant_id,
    merchant_oid: oid,
    paytr_token,
  };

  let resp: Response;
  let rawText = '';
  try {
    resp = await fetch('https://www.paytr.com/odeme/durum-sorgu', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: toFormUrlEncoded(postBody),
    });
    rawText = await resp.text();
  } catch (err: any) {
    throw new Error(`paytr_status_network_failed:${err?.message || 'unknown'}`);
  }

  let raw: any = null;
  try {
    raw = rawText ? JSON.parse(rawText) : null;
  } catch {
    raw = null;
  }

  if (!resp.ok) {
    throw new Error(`paytr_status_http_${resp.status}`);
  }

  if (!raw) {
    throw new Error('paytr_status_empty_response');
  }

  return raw as PaytrStatusResult;
}
