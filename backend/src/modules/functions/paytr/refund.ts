// ===================================================================
// FILE: src/modules/functions/paytr/refund.ts
// PayTR İade (Refund) API
// POST https://www.paytr.com/odeme/iade
// Hash: base64(hmac_sha256(merchant_id + merchant_oid + return_amount + merchant_salt, merchant_key))
// ===================================================================

import crypto from 'crypto';
import { getPaytrConfig } from '@/modules/payments/service';

export type PaytrRefundParams = {
  merchant_oid: string;   // Sipariş numarası
  return_amount: number;  // İade tutarı TL (ör: 11.97)
  reference_no?: string;  // Opsiyonel referans no (maks 64 karakter, alfanumerik)
};

export type PaytrRefundResult = {
  status: 'success' | 'error';
  is_test?: number;
  merchant_oid?: string;
  return_amount?: string;
  err_no?: string;
  err_msg?: string;
};

function toFormUrlEncoded(obj: Record<string, string>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.set(k, v);
  return p.toString();
}

export async function createPaytrRefund(params: PaytrRefundParams): Promise<PaytrRefundResult> {
  if (!params.merchant_oid?.trim()) throw new Error('paytr_refund_missing_merchant_oid');
  if (!params.return_amount || params.return_amount <= 0)
    throw new Error('paytr_refund_invalid_return_amount');

  const cfg = await getPaytrConfig('paytr');

  const merchant_id = cfg.merchantId;
  const merchant_key = cfg.merchantKey;
  const merchant_salt = cfg.merchantSalt;
  const merchant_oid = params.merchant_oid.trim();
  // PayTR expects amount as decimal string: "11.97"
  const return_amount = params.return_amount.toFixed(2);

  // Hash: base64(hmac_sha256(merchant_id + merchant_oid + return_amount + merchant_salt, merchant_key))
  const hashStr = `${merchant_id}${merchant_oid}${return_amount}${merchant_salt}`;
  const paytr_token = crypto
    .createHmac('sha256', merchant_key)
    .update(hashStr, 'utf8')
    .digest('base64');

  const postBody: Record<string, string> = {
    merchant_id,
    merchant_oid,
    return_amount,
    paytr_token,
  };

  if (params.reference_no?.trim()) {
    postBody['reference_no'] = params.reference_no.trim().slice(0, 64);
  }

  let resp: Response;
  let rawText = '';
  try {
    resp = await fetch('https://www.paytr.com/odeme/iade', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: toFormUrlEncoded(postBody),
    });
    rawText = await resp.text();
  } catch (err: any) {
    throw new Error(`paytr_refund_network_failed:${err?.message || 'unknown'}`);
  }

  let raw: any = null;
  try {
    raw = rawText ? JSON.parse(rawText) : null;
  } catch {
    raw = null;
  }

  if (!resp.ok) {
    throw new Error(`paytr_refund_http_${resp.status}`);
  }

  if (!raw) {
    throw new Error('paytr_refund_empty_response');
  }

  return raw as PaytrRefundResult;
}
