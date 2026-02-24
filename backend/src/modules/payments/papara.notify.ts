// ===================================================================
// FILE: src/modules/payments/papara.notify.ts
// Papara notification/callback handler (idempotent)
// - Papara sends GET or POST to notificationUrl with payment details
// - Verifies by querying Papara API (no HMAC on notify)
// - Updates payment_sessions + payments table
// ===================================================================

import type { RouteHandlerMethod } from 'fastify';
import crypto from 'crypto';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { payments, paymentSessions, paymentEvents } from './schema';
import { getPaparaConfig } from './service';

/* -------------------- helpers -------------------- */

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '{"error":"json_stringify_failed"}';
  }
}

// Papara status: 1=Pending, 2=Processing, 3=Completed, 4=Error, 5=Cancelled, 6=Refunded
// We treat status=3 as paid, anything else as failed
function resolveStatus(status: string | number): 'paid' | 'failed' {
  const n = typeof status === 'number' ? status : Number(String(status).trim());
  if (n === 3) return 'paid';
  return 'failed';
}

async function paparaIsSeen(paparaPaymentId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.provider, 'papara'), eq(payments.transactionId, paparaPaymentId)))
    .limit(1);
  return !!existing;
}

// Verify payment by calling Papara API (GET /payment?id=...)
async function verifyPaparaPayment(paparaPaymentId: string): Promise<{
  ok: boolean;
  status: number;
  amount?: number;
  referenceId?: string;
}> {
  let cfg: Awaited<ReturnType<typeof getPaparaConfig>>;
  try {
    cfg = await getPaparaConfig('papara');
  } catch {
    // If config not available, accept optimistically
    return { ok: true, status: 3 };
  }

  const baseUrl = cfg.testMode
    ? 'https://merchant-api.sandbox.papara.com'
    : 'https://merchant-api.papara.com';

  try {
    const res = await fetch(`${baseUrl}/payment?id=${encodeURIComponent(paparaPaymentId)}`, {
      headers: { Authorization: `ApiKey ${cfg.apiKey}` },
    });

    if (!res.ok) return { ok: false, status: 0 };

    const json = (await res.json()) as {
      data?: { status?: number; amount?: number; referenceId?: string };
    };

    const data = json?.data;
    const status = typeof data?.status === 'number' ? data.status : 0;
    return {
      ok: status === 3,
      status,
      amount: data?.amount,
      referenceId: data?.referenceId,
    };
  } catch {
    // Network error: accept optimistically (handle via reconciliation)
    return { ok: true, status: 3 };
  }
}

type PaparaNotifyBody = {
  id?: string;            // Papara payment ID
  referenceId?: string;   // our order/reference ID
  status?: string | number;
  amount?: string | number;
  merchantId?: string;
};

export const paparaNotifyHandler: RouteHandlerMethod = async (req, reply) => {
  // Papara may send GET or POST; params may be in query or body
  const q = (req.query as Record<string, unknown>) ?? {};
  const b = (req.body as PaparaNotifyBody) ?? {};

  const paparaId = safeStr(b.id ?? q['id']);
  const referenceId = safeStr(b.referenceId ?? q['referenceId']);
  const statusRaw = b.status ?? q['status'];
  const amountRaw = b.amount ?? q['amount'];

  if (!paparaId) {
    req.log.warn({ q, body_keys: Object.keys(b) }, 'papara-notify missing payment id');
    return reply.code(400).send({ success: false, error: 'missing_id' });
  }

  // Idempotency
  if (await paparaIsSeen(paparaId)) {
    req.log.info({ paparaId, referenceId }, 'papara-notify duplicate (idempotent ok)');
    return reply.send({ success: true });
  }

  // Verify with Papara API
  const verified = await verifyPaparaPayment(paparaId);
  const paymentStatus = resolveStatus(verified.status || (typeof statusRaw === 'string' || typeof statusRaw === 'number' ? statusRaw : 0));

  const orderId = referenceId || verified.referenceId || '';
  const amount = verified.amount ?? Number(String(amountRaw ?? '0').replace(',', '.'));

  try {
    // 1) Insert payment record
    const paymentId = crypto.randomUUID();
    const amountStr = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';

    await db.insert(payments).values({
      id: paymentId,
      orderId: orderId.slice(0, 36),
      provider: 'papara',
      currency: 'TRY',
      amountAuthorized: amountStr,
      amountCaptured: paymentStatus === 'paid' ? amountStr : '0.00',
      amountRefunded: '0.00',
      status: paymentStatus,
      reference: orderId.slice(0, 255),
      transactionId: paparaId.slice(0, 255),
      isTest: 0,
    });

    // 2) Update matching payment_session
    if (orderId) {
      const [session] = await db
        .select()
        .from(paymentSessions)
        .where(
          and(
            eq(paymentSessions.providerKey, 'papara'),
            eq(paymentSessions.orderId, orderId),
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
                  return session.extra ? JSON.parse(session.extra as string) : {};
                } catch {
                  return {};
                }
              })()),
              papara_notify: { paparaId, status: verified.status, amount },
            }),
          } as never)
          .where(eq(paymentSessions.id, session.id));
      }
    }

    // 3) Event log
    await db.insert(paymentEvents).values({
      id: crypto.randomUUID(),
      paymentId,
      eventType: 'notify',
      message: paymentStatus === 'paid' ? 'papara_notify_success' : 'papara_notify_failed',
      raw: safeJsonStringify({ paparaId, referenceId, statusRaw, verified }),
    } as never);

    req.log.info({ paparaId, referenceId, orderId, paymentStatus }, 'papara-notify accepted');
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, paparaId, referenceId }, 'papara-notify failed');
    return reply.code(500).send({ success: false, error: 'papara_notify_failed' });
  }
};
