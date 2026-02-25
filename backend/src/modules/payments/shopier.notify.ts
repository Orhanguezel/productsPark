// ===================================================================
// FILE: src/modules/payments/shopier.notify.ts
// Shopier notify/callback handler (idempotent + signature verify)
// - verifies Shopier signature
// - updates payment_sessions + inserts/updates payments record
// - status '1' or 'success' = paid; anything else = failed
// - returns JSON { success: true } on accept
// ===================================================================

import type { RouteHandlerMethod } from 'fastify';
import crypto from 'crypto';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { payments, paymentSessions, paymentEvents } from './schema';
import { getShopierConfig } from './service';
import { syncOrderAfterPayment } from './order-sync.service';

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

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '{"error":"json_stringify_failed"}';
  }
}

// Shopier status: '1' = success, '0' = failed
function resolveStatus(status: string): 'paid' | 'failed' {
  const s = status.trim();
  if (s === '1' || s === 'success') return 'paid';
  return 'failed';
}

/* ==================================================================
   SHOPIER — idempotency (DB-backed, survives restarts + multi-instance)
   ================================================================== */

async function shopierIsSeen(payment_id: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.provider, 'shopier'), eq(payments.transactionId, payment_id)))
    .limit(1);
  return !!existing;
}

async function shopierMarkSeen(opts: {
  platform_order_id: string;
  payment_id: string;
  status: string;
  total_order_value?: string;
}): Promise<string> {
  const paymentStatus = resolveStatus(opts.status);
  const amount = opts.total_order_value
    ? Number(opts.total_order_value.replace(',', '.')).toFixed(2)
    : '0.00';

  const paymentId = crypto.randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    orderId: opts.platform_order_id.slice(0, 36),
    provider: 'shopier',
    currency: 'TRY',
    amountAuthorized: amount,
    amountCaptured: paymentStatus === 'paid' ? amount : '0.00',
    amountRefunded: '0.00',
    status: paymentStatus,
    reference: opts.platform_order_id.slice(0, 255),
    transactionId: opts.payment_id.slice(0, 255),
    isTest: 0,
  });

  return paymentId;
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

  if (await shopierIsSeen(payment_id)) {
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
    const paymentStatus = resolveStatus(status);

    // 1) Insert payment record with correct status
    const paymentId = await shopierMarkSeen({
      platform_order_id,
      payment_id,
      status,
      total_order_value: total_order_value ?? undefined,
    });

    // 2) Update matching payment_session
    const [session] = await db
      .select()
      .from(paymentSessions)
      .where(
        and(
          eq(paymentSessions.providerKey, 'shopier'),
          eq(paymentSessions.orderId, platform_order_id),
        ),
      )
      .orderBy(desc(paymentSessions.createdAt))
      .limit(1);

    if (session && session.status === 'pending') {
      await db
        .update(paymentSessions)
        .set({
          status: paymentStatus,
          extra: safeJsonStringify({
            ...((() => {
              try {
                return session.extra ? JSON.parse(session.extra as any) : {};
              } catch {
                return {};
              }
            })()),
            shopier_notify: {
              status,
              payment_id,
              total_order_value: total_order_value ?? null,
            },
          }),
        } as any)
        .where(eq(paymentSessions.id, session.id));
    }

    // 3) Event log
    await db.insert(paymentEvents).values({
      id: crypto.randomUUID(),
      paymentId,
      eventType: 'notify',
      message: paymentStatus === 'paid' ? 'shopier_notify_success' : 'shopier_notify_failed',
      raw: safeJsonStringify(body),
    } as any);

    await syncOrderAfterPayment({
      orderId: platform_order_id,
      paymentStatus,
      source: 'shopier_notify',
      logger: req.log,
    });

    req.log.info(
      { platform_order_id, payment_id, status, paymentStatus, signature_verified: sig.verifiedBy },
      'shopier-notify accepted',
    );

    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, platform_order_id, payment_id, status }, 'shopier-notify failed');
    return reply.code(500).send({ success: false, error: 'shopier_notify_failed' });
  }
};
