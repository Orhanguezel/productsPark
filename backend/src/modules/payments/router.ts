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
} from './controller';

import { paytrNotifyHandler } from './paytr.notify';
import { shopierNotifyHandler } from './shopier.notify';

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

  // PayTR notify (public)
  // IMPORTANT: expose this URL in payment_providers.public_config.notification_url
  app.post('/paytr/notify', paytrNotifyHandler);

  // Shopier notify (public)
  app.post('/shopier/notify', shopierNotifyHandler);
}
