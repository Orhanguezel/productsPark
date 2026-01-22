// ===================================================================
// FILE: src/modules/payments/router.ts
// FINAL — Payments public routes (hardened)
// - payment_requests: auth required
// - payment_sessions: create/get only (no capture/cancel public)
// ===================================================================

import type { FastifyInstance } from 'fastify';

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

export async function registerPayments(app: FastifyInstance) {
  // Public aggregate for checkout
  app.get('/public/payment-methods', getPublicPaymentMethodsHandler);

  // Providers (public)
  app.get('/payment_providers', listPaymentProvidersHandler);
  app.get('/payment_providers/:key', getPaymentProviderByKeyHandler);

  // Payment Requests (AUTH REQUIRED)
  app.get('/payment_requests', { config: { auth: true } }, listPaymentRequestsHandler);
  app.get('/payment_requests/:id', { config: { auth: true } }, getPaymentRequestByIdHandler);
  app.post('/payment_requests', { config: { auth: true } }, createPaymentRequestHandler);
  app.delete('/payment_requests/:id', { config: { auth: true } }, deletePaymentRequestHandler);

  // Payment Sessions (public create/get only)
  app.post('/payment_sessions', createPaymentSessionHandler);
  app.get('/payment_sessions/:id', getPaymentSessionByIdHandler);

  // ⚠️ NO public capture/cancel:
  // - capture/cancel must be provider callback or admin-only.
}
