// ===================================================================
// FILE: src/modules/payments/router.ts
// FINAL — Payments routes (+ PayTR notify)
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';

import {
  // providers
  listPaymentProvidersHandler,
  getPaymentProviderByKeyHandler,

  // payment requests
  listPaymentRequestsHandler,
  getPaymentRequestByIdHandler,
  createPaymentRequestHandler,
  deletePaymentRequestHandler,

  // payment sessions
  createPaymentSessionHandler,
  getPaymentSessionByIdHandler,

  // public aggregate
  getPublicPaymentMethodsHandler,

  // PayTR admin actions
  paytrRefundHandler,
  paytrStatusHandler,
} from './controller';

import { paytrNotifyHandler } from './paytr.notify';
import { shopierNotifyHandler } from './shopier.notify';
import { stripeWebhookHandler } from './stripe.webhook';
import { paparaNotifyHandler } from './papara.notify';

export async function registerPayments(app: FastifyInstance) {
  // Public aggregate for checkout
  app.get('/public/payment-methods', getPublicPaymentMethodsHandler);

  // Providers (public)
  app.get('/payment_providers', listPaymentProvidersHandler);
  app.get('/payment_providers/:key', getPaymentProviderByKeyHandler);

  // Payment Requests (AUTH REQUIRED)
  app.get('/payment_requests', { preHandler: [requireAuth] }, listPaymentRequestsHandler);
  app.get('/payment_requests/:id', { preHandler: [requireAuth] }, getPaymentRequestByIdHandler);
  app.post('/payment_requests', { preHandler: [requireAuth] }, createPaymentRequestHandler);
  app.delete('/payment_requests/:id', { preHandler: [requireAuth] }, deletePaymentRequestHandler);

  // Payment Sessions (public create/get only)
  app.post('/payment_sessions', createPaymentSessionHandler);
  app.get('/payment_sessions/:id', getPaymentSessionByIdHandler);

  // PayTR notify (public — called by PayTR server)
  // IMPORTANT: expose this URL in payment_providers.public_config.notification_url
  app.post('/paytr/notify', paytrNotifyHandler);

  // PayTR İade (Refund) — auth required
  // Body: { merchant_oid, return_amount, reference_no? }
  app.post('/paytr/refund', { preHandler: [requireAuth] }, paytrRefundHandler);

  // PayTR Durum Sorgu (Status Query) — auth required
  // Body: { merchant_oid }
  app.post('/paytr/status', { preHandler: [requireAuth] }, paytrStatusHandler);

  // Shopier notify (public)
  app.post('/shopier/notify', shopierNotifyHandler);

  // Stripe webhook (public — called by Stripe servers)
  // config: { rawBody: true } → fastify-raw-body plugin bu rotada req.rawBody doldurur
  app.post('/stripe/webhook', { config: { rawBody: true } }, stripeWebhookHandler);

  // Papara notify (public — called by Papara servers; supports GET + POST)
  app.post('/papara/notify', paparaNotifyHandler);
  app.get('/papara/notify', paparaNotifyHandler);
}
