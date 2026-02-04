// ===================================================================
// FILE: src/modules/payments/paytr.notify.ts
// FINAL — PayTR notify/callback handler (idempotent + hash verify)
// - verifies PayTR hash
// - updates payment_sessions + creates/updates payments
// - writes payment_events
// - returns plain "OK" on success (PayTR requires this)
// ===================================================================

import crypto from 'crypto';
import type { RouteHandlerMethod } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { paymentSessions, payments, paymentEvents } from './schema';
import { getPaytrConfig } from './service';

const PAYTR_NOTIFY_BODY = z.object({
  merchant_oid: z.string().min(1),
  status: z.enum(['success', 'failed']),
  total_amount: z.union([z.string().min(1), z.number()]),
  hash: z.string().min(1),

  // optional extras PayTR may send (we keep for raw log)
  failed_reason_code: z.union([z.string(), z.number()]).optional(),
  failed_reason_msg: z.string().optional(),
  payment_amount: z.union([z.string(), z.number()]).optional(),
});

function toStr(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(toStr(v).trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toTryFromKurus(kurus: number): string {
  // payments.amount_* columns are decimal(10,2) strings expected by Drizzle inserts
  return (kurus / 100).toFixed(2);
}

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '{"error":"json_stringify_failed"}';
  }
}

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function computePaytrNotifyHash(
  merchant_oid: string,
  status: string,
  total_amount: string,
  merchant_key: string,
  merchant_salt: string,
): string {
  // PayTR notify hash formula:
  // base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
  const hashStr = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
  return crypto.createHmac('sha256', merchant_key).update(hashStr, 'utf8').digest('base64');
}

/**
 * IMPORTANT:
 * - This endpoint must be reachable from internet (HTTPS)
 * - Must return "OK" on successful processing
 */
export const paytrNotifyHandler: RouteHandlerMethod = async (req, reply) => {
  const parsed = PAYTR_NOTIFY_BODY.safeParse((req as any).body ?? req.body ?? {});
  if (!parsed.success) {
    req.log.warn({ details: parsed.error.format() }, 'paytr-notify validation_error');
    // PayTR retries on non-OK, but invalid payload isn't actionable -> reject
    return reply.code(400).type('text/plain; charset=utf-8').send('BAD_REQUEST');
  }

  const body = parsed.data;

  const merchant_oid = body.merchant_oid.trim();
  const status = body.status;
  const total_amount_raw = toStr(body.total_amount).trim(); // usually integer kuruş as string
  const receivedHash = body.hash.trim();

  // Load config (secret) to verify hash
  let cfg: Awaited<ReturnType<typeof getPaytrConfig>>;
  try {
    cfg = await getPaytrConfig('paytr');
  } catch (e: any) {
    req.log.error({ err: e?.message || e }, 'paytr-notify config missing');
    // returning non-OK will cause retries; but config missing is ops issue. Still: reject.
    return reply.code(500).type('text/plain; charset=utf-8').send('CONFIG_ERROR');
  }

  const expectedHash = computePaytrNotifyHash(
    merchant_oid,
    status,
    total_amount_raw,
    cfg.merchantKey,
    cfg.merchantSalt,
  );

  if (!timingSafeEq(expectedHash, receivedHash)) {
    req.log.warn({ merchant_oid, status, total_amount: total_amount_raw }, 'paytr-notify BAD_HASH');
    return reply.code(400).type('text/plain; charset=utf-8').send('BAD_HASH');
  }

  // Idempotent processing:
  // - Find latest matching session by (provider=paytr, orderId=merchant_oid)
  // - Update only if still pending; otherwise just ack OK
  const [session] = await db
    .select()
    .from(paymentSessions)
    .where(and(eq(paymentSessions.providerKey, 'paytr'), eq(paymentSessions.orderId, merchant_oid)))
    .orderBy(desc(paymentSessions.createdAt))
    .limit(1);

  const totalKurus = toInt(total_amount_raw, 0);
  const totalTry = toTryFromKurus(totalKurus);

  // If we have no session, we still ACK OK (hash verified) to avoid endless retries,
  // but we log the incident.
  if (!session) {
    req.log.error({ merchant_oid }, 'paytr-notify session_not_found');

    // Write an orphan event (no paymentId). We still store it by creating a payment record.
    const paymentId = crypto.randomUUID();
    await db.insert(payments).values({
      id: paymentId,
      orderId: merchant_oid,
      provider: 'paytr',
      currency: 'TRY',
      amountAuthorized: totalTry,
      amountCaptured: status === 'success' ? totalTry : '0.00',
      amountRefunded: '0.00',
      feeAmount: null,
      status: status === 'success' ? 'paid' : 'failed',
      reference: merchant_oid,
      transactionId: null,
      isTest: cfg.testMode ? 1 : 0,
      metadata: safeJsonStringify({ source: 'paytr_notify', note: 'session_not_found' }),
    } as any);

    await db.insert(paymentEvents).values({
      id: crypto.randomUUID(),
      paymentId,
      eventType: 'notify',
      message: status === 'success' ? 'paytr_notify_success' : 'paytr_notify_failed',
      raw: safeJsonStringify(body),
    } as any);

    return reply.type('text/plain; charset=utf-8').send('OK');
  }

  // If already processed, ack OK (idempotent)
  if (session.status !== 'pending') {
    req.log.info(
      { merchant_oid, session_status: session.status, notify_status: status },
      'paytr-notify already_processed',
    );
    return reply.type('text/plain; charset=utf-8').send('OK');
  }

  // Create or update payment record by reference=merchant_oid (idempotent)
  const [existingPay] = await db
    .select()
    .from(payments)
    .where(eq(payments.reference, merchant_oid))
    .limit(1);

  const paymentId = existingPay?.id ?? crypto.randomUUID();

  const newPaymentStatus = status === 'success' ? 'paid' : 'failed';
  const captured = status === 'success' ? totalTry : '0.00';

  if (!existingPay) {
    await db.insert(payments).values({
      id: paymentId,
      orderId: session.orderId ?? merchant_oid,
      provider: 'paytr',
      currency: session.currency ?? 'TRY',
      amountAuthorized: (session.amount as any) ?? totalTry,
      amountCaptured: captured,
      amountRefunded: '0.00',
      feeAmount: null,
      status: newPaymentStatus,
      reference: merchant_oid,
      transactionId: null,
      isTest: cfg.testMode ? 1 : 0,
      metadata: safeJsonStringify({
        merchant_oid,
        total_amount: total_amount_raw,
        payment_amount: body.payment_amount ?? null,
      }),
    } as any);
  } else {
    await db
      .update(payments)
      .set({
        status: newPaymentStatus,
        amountCaptured: captured,
        isTest: cfg.testMode ? 1 : 0,
        metadata: safeJsonStringify({
          ...(existingPay.metadata ? { prev: existingPay.metadata } : {}),
          merchant_oid,
          total_amount: total_amount_raw,
          payment_amount: body.payment_amount ?? null,
        }),
      } as any)
      .where(eq(payments.id, paymentId));
  }

  // Update session
  await db
    .update(paymentSessions)
    .set({
      status: newPaymentStatus, // keep your domain statuses aligned: pending/paid/failed
      // (optional) could store paytr info inside extra as well:
      extra: safeJsonStringify({
        ...(session.extra
          ? (() => {
              try {
                return JSON.parse(session.extra as any);
              } catch {
                return {};
              }
            })()
          : {}),
        paytr_notify: {
          status,
          total_amount: total_amount_raw,
          failed_reason_code: body.failed_reason_code ?? null,
          failed_reason_msg: body.failed_reason_msg ?? null,
        },
      }),
    } as any)
    .where(eq(paymentSessions.id, session.id));

  // Event log
  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId,
    eventType: 'notify',
    message: status === 'success' ? 'paytr_notify_success' : 'paytr_notify_failed',
    raw: safeJsonStringify(body),
  } as any);

  return reply.type('text/plain; charset=utf-8').send('OK');
};
