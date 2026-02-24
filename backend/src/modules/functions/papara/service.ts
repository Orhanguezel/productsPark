// ===================================================================
// FILE: src/modules/functions/papara/service.ts
// Papara Merchant API — creates a payment link
// - Reads config via getPaparaConfig('papara')
// - POST https://merchant-api.papara.com/payment  (live)
//   POST https://merchant-api.sandbox.papara.com/payment  (test)
// ===================================================================

import { getPaparaConfig } from '@/modules/payments/service';

export type PaparaCreateBody = {
  amount: number;           // TRY (e.g. 100.00)
  referenceId: string;      // our order ID
  orderDescription?: string;
  notificationUrl?: string;
  redirectUrl?: string;
  failUrl?: string;
  turkishNationalId?: string;
};

export type PaparaPaymentResult = {
  id: string;              // Papara payment ID
  paymentUrl: string;      // URL to redirect user to
};

type PaparaApiResponse = {
  data?: {
    id?: string;
    paymentUrl?: string;
    payment_url?: string;
  };
  succeeded?: boolean;
  error?: { code?: number; message?: string };
};

export async function createPaparaPayment(body: PaparaCreateBody): Promise<PaparaPaymentResult> {
  const cfg = await getPaparaConfig('papara');

  const baseUrl = cfg.testMode
    ? 'https://merchant-api.sandbox.papara.com'
    : 'https://merchant-api.papara.com';

  const notificationUrl = body.notificationUrl ?? cfg.notificationUrl ?? undefined;
  const redirectUrl = body.redirectUrl ?? cfg.redirectUrl ?? undefined;
  const failRedirectUrl = body.failUrl ?? cfg.failUrl ?? redirectUrl;

  const payload: Record<string, unknown> = {
    amount: Number(body.amount.toFixed(2)),
    referenceId: body.referenceId,
    orderDescription: body.orderDescription ?? 'Sipariş Ödemesi',
    currency: 0, // 0 = TRY
  };

  if (notificationUrl) payload.notificationUrl = notificationUrl;
  if (redirectUrl) payload.redirectUrl = redirectUrl;
  if (failRedirectUrl) payload.failRedirectUrl = failRedirectUrl;
  if (body.turkishNationalId) payload.turkishNationalId = body.turkishNationalId;

  const res = await fetch(`${baseUrl}/payment`, {
    method: 'POST',
    headers: {
      Authorization: `ApiKey ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status));
    throw new Error(`papara_api_error: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as PaparaApiResponse;

  if (json.succeeded === false) {
    const msg = json.error?.message ?? 'papara_api_rejected';
    throw new Error(msg);
  }

  const id = json?.data?.id;
  const paymentUrl = json?.data?.paymentUrl ?? json?.data?.payment_url;

  if (!id || !paymentUrl) {
    throw new Error('papara_invalid_response');
  }

  return { id, paymentUrl };
}
