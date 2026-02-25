// ===================================================================
// FILE: src/modules/payments/stripe.webhook.ts
// Stripe webhook handler
// - checkout.session.completed → payment paid
// - checkout.session.expired   → payment failed
// - payment_intent.payment_failed → payment failed
// ÖNEMLI: raw body gerekir (Stripe signature verify için)
// ===================================================================

import type { RouteHandlerMethod } from 'fastify';
import type { FastifyRequest } from 'fastify';
import Stripe from 'stripe';
import crypto from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { payments, paymentSessions, paymentEvents } from './schema';
import { getStripeConfig } from './service';
import { env } from '@/core/env';
import { syncOrderAfterPayment } from './order-sync.service';

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '{}';
  }
}

async function updateSessionAndPayment(opts: {
  merchant_oid: string;
  stripe_session_id: string;
  amount_total: number;   // kuruş
  currency: string;
  newStatus: 'paid' | 'failed';
  rawEvent: unknown;
  eventType: string;
  logger?: { info?: (...args: any[]) => void; warn?: (...args: any[]) => void; error?: (...args: any[]) => void };
}): Promise<void> {
  const amountTry = (opts.amount_total / 100).toFixed(2);
  const paymentStatus = opts.newStatus;

  // Mevcut payment kaydı var mı?
  const [existingPay] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, 'stripe'), eq(payments.reference, opts.merchant_oid)))
    .limit(1);

  const paymentId = existingPay?.id ?? crypto.randomUUID();

  if (!existingPay) {
    await db.insert(payments).values({
      id: paymentId,
      orderId: opts.merchant_oid.slice(0, 36),
      provider: 'stripe',
      currency: opts.currency.toUpperCase(),
      amountAuthorized: amountTry,
      amountCaptured: paymentStatus === 'paid' ? amountTry : '0.00',
      amountRefunded: '0.00',
      status: paymentStatus,
      reference: opts.merchant_oid.slice(0, 255),
      transactionId: opts.stripe_session_id.slice(0, 255),
      isTest: opts.stripe_session_id.startsWith('cs_test') ? 1 : 0,
    } as any);
  } else {
    await db
      .update(payments)
      .set({
        status: paymentStatus,
        amountCaptured: paymentStatus === 'paid' ? amountTry : existingPay.amountCaptured,
        transactionId: opts.stripe_session_id.slice(0, 255),
      } as any)
      .where(eq(payments.id, paymentId));
  }

  // Payment session güncelle
  const [session] = await db
    .select()
    .from(paymentSessions)
    .where(
      and(eq(paymentSessions.providerKey, 'stripe'), eq(paymentSessions.orderId, opts.merchant_oid)),
    )
    .orderBy(desc(paymentSessions.createdAt))
    .limit(1);

  if (session && session.status === 'pending') {
    await db
      .update(paymentSessions)
      .set({ status: paymentStatus } as any)
      .where(eq(paymentSessions.id, session.id));
  }

  // Event log
  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId,
    eventType: 'webhook',
    message: `stripe_${opts.eventType}`,
    raw: safeJsonStringify(opts.rawEvent),
  } as any);

  await syncOrderAfterPayment({
    orderId: opts.merchant_oid,
    paymentStatus,
    source: `stripe_${opts.eventType}`,
    logger: opts.logger,
  });
}

export const stripeWebhookHandler: RouteHandlerMethod = async (req, reply) => {
  // Stripe webhook secret — önce DB'den, sonra env'den
  let webhookSecret: string;
  try {
    const cfg = await getStripeConfig('stripe');
    webhookSecret = cfg.webhookSecret;
  } catch {
    webhookSecret = env.STRIPE.WEBHOOK_SECRET;
  }

  if (!webhookSecret) {
    req.log.error('stripe-webhook: webhook_secret_missing');
    return reply.code(500).send({ error: 'webhook_secret_missing' });
  }

  // Stripe imza doğrulama için raw body gerekir
  const rawBody = (req as any).rawBody as Buffer | string | undefined;
  const sig = req.headers['stripe-signature'] as string | undefined;

  if (!sig || !rawBody) {
    req.log.warn('stripe-webhook: missing signature or raw body');
    return reply.code(400).send({ error: 'missing_signature' });
  }

  const stripe = new Stripe(
    (await getStripeConfig('stripe').catch(() => ({ secretKey: env.STRIPE.SECRET_KEY }))).secretKey,
    { apiVersion: '2026-01-28.clover' },
  );

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    req.log.warn({ err: err?.message }, 'stripe-webhook: signature verification failed');
    return reply.code(400).send({ error: `webhook_signature_failed: ${err?.message}` });
  }

  req.log.info({ event_type: event.type }, 'stripe-webhook received');

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const merchant_oid = session.metadata?.merchant_oid ?? session.id;
      const amount = session.amount_total ?? 0;
      const currency = session.currency ?? 'try';

      if (session.payment_status === 'paid') {
        await updateSessionAndPayment({
          merchant_oid,
          stripe_session_id: session.id,
          amount_total: amount,
          currency,
          newStatus: 'paid',
          rawEvent: event,
          eventType: 'checkout_completed',
          logger: req.log,
        });
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const merchant_oid = session.metadata?.merchant_oid ?? session.id;

      await updateSessionAndPayment({
        merchant_oid,
        stripe_session_id: session.id,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? 'try',
        newStatus: 'failed',
        rawEvent: event,
        eventType: 'checkout_expired',
        logger: req.log,
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const merchant_oid = pi.metadata?.merchant_oid ?? pi.id;

      await updateSessionAndPayment({
        merchant_oid,
        stripe_session_id: pi.id,
        amount_total: pi.amount ?? 0,
        currency: pi.currency ?? 'try',
        newStatus: 'failed',
        rawEvent: event,
        eventType: 'payment_failed',
        logger: req.log,
      });
    }
    // Diğer event'ler sessizce yutulur (Stripe çok fazla event gönderir)
  } catch (err: any) {
    req.log.error({ err: err?.message, event_type: event.type }, 'stripe-webhook: processing error');
    // 500 dönersek Stripe tekrar dener → 200 dönerek log'a bırakıyoruz
  }

  return reply.send({ received: true });
};
