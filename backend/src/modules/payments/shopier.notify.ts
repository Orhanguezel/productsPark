// ===================================================================
// FILE: src/modules/payments/shopier.notify.ts
// Shopier notify/callback handler (idempotent + signature verify)
// - verifies Shopier signature
// - returns JSON { success: true } on accept
// ===================================================================

import type { RouteHandlerMethod } from 'fastify';
import crypto from 'crypto';

import { getShopierConfig } from './service';

/* -------------------- helpers -------------------- */

function safeString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/* ==================================================================
   SHOPIER — idempotency (process memory)
   ================================================================== */

const shopierSeen = new Map<string, number>();
function shopierIdempotencyKey(platform_order_id: string, payment_id: string): string {
  return `${platform_order_id}::${payment_id}`;
}
function shopierMarkSeen(key: string) {
  shopierSeen.set(key, Date.now());
}
function shopierIsSeen(key: string): boolean {
  return shopierSeen.has(key);
}

/**
 * Shopier callback signature verify (DB-first, fallback ENV):
 * signature = base64(hmac_sha256(secret, random_nr + platform_order_id + total_order_value + currency))
 */
async function verifyShopierCallbackSignature(args: {
  platform_order_id: string;
  status: string;
  payment_id: string;
  random_nr?: string;
  total_order_value?: string;
  currency?: string | number;
  signature: string;
}): Promise<{ ok: boolean; reason?: string; verifiedBy?: 'db' | 'env' | 'skipped' }> {
  let secret: string | undefined;

  // 1) DB secret
  try {
    const cfg = await getShopierConfig('shopier');
    secret = cfg.secret;
  } catch {
    // ignore
  }

  // 2) ENV fallback (legacy)
  if (!secret) secret = process.env.SHOPIER_CALLBACK_SECRET || undefined;

  // 3) No secret => accept mode
  if (!secret) return { ok: true, reason: 'secret_not_configured', verifiedBy: 'skipped' };

  const random_nr = args.random_nr ? String(args.random_nr).trim() : '';
  const total_order_value = args.total_order_value ? String(args.total_order_value).trim() : '';
  const currencyRaw = args.currency;

  // Callback body bunları göndermiyorsa verify edemeyiz -> accept mode
  if (!random_nr || !total_order_value || currencyRaw == null) {
    return { ok: true, reason: 'missing_verify_fields', verifiedBy: 'skipped' };
  }

  const currencyCode =
    typeof currencyRaw === 'number' ? currencyRaw : Number(String(currencyRaw).trim());

  const moneyNorm = (() => {
    const n = Number(total_order_value.replace(',', '.'));
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  })();

  const dataToSign = `${random_nr}${args.platform_order_id}${moneyNorm}${currencyCode}`;
  const expected = crypto.createHmac('sha256', secret).update(dataToSign, 'utf8').digest('base64');

  const ok = timingSafeEqual(expected, args.signature);
  const verifiedBy: 'db' | 'env' = secret === process.env.SHOPIER_CALLBACK_SECRET ? 'env' : 'db';

  return ok ? { ok: true, verifiedBy } : { ok: false, reason: 'invalid_signature', verifiedBy };
}

type ShopierCallbackBody = {
  platform_order_id?: string;
  status?: string;
  payment_id?: string;
  signature?: string;

  random_nr?: string;
  total_order_value?: string;
  currency?: string | number;

  API_key?: string;
};

export const shopierNotifyHandler: RouteHandlerMethod = async (req, reply) => {
  const body = (req.body as ShopierCallbackBody) || {};

  const platform_order_id = safeString(body.platform_order_id);
  const status = safeString(body.status);
  const payment_id = safeString(body.payment_id);
  const signature = safeString(body.signature);

  const random_nr = safeString(body.random_nr);
  const total_order_value = safeString(body.total_order_value);

  if (!platform_order_id || !status || !payment_id || !signature) {
    req.log.warn(
      { body_keys: Object.keys(body || {}), platform_order_id, status, payment_id },
      'shopier-notify missing required fields',
    );
    return reply.code(400).send({ success: false, error: 'missing_fields' });
  }

  const idemKey = shopierIdempotencyKey(platform_order_id, payment_id);
  if (shopierIsSeen(idemKey)) {
    req.log.info(
      { platform_order_id, payment_id, status },
      'shopier-notify duplicate (idempotent ok)',
    );
    return reply.send({ success: true });
  }

  const sig = await verifyShopierCallbackSignature({
    platform_order_id,
    status,
    payment_id,
    random_nr: random_nr || undefined,
    total_order_value: total_order_value || undefined,
    currency: body.currency,
    signature,
  });

  if (!sig.ok) {
    req.log.warn(
      { platform_order_id, payment_id, status, reason: sig.reason, verifiedBy: sig.verifiedBy },
      'shopier-notify signature invalid',
    );
    return reply.code(401).send({ success: false, error: sig.reason || 'unauthorized' });
  }

  try {
    shopierMarkSeen(idemKey);

    req.log.info(
      { platform_order_id, payment_id, status, signature_verified: sig.verifiedBy },
      'shopier-notify accepted',
    );

    // TODO (prod):
    // - order/payment lookup by platform_order_id
    // - status success -> mark paid
    // - fulfillment, mail, audit log

    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, platform_order_id, payment_id, status }, 'shopier-notify failed');
    return reply.code(500).send({ success: false, error: 'shopier_notify_failed' });
  }
};
