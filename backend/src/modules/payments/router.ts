// src/modules/payments/router.ts

import type { FastifyInstance } from 'fastify';
import {
  listPaymentProvidersHandler,
  getPaymentProviderByKeyHandler,
  listPaymentRequestsHandler,
  createPaymentRequestHandler,
  createPaymentSessionHandler,
  getPaymentSessionByIdHandler,
  capturePaymentSessionHandler,
  cancelPaymentSessionHandler,
} from './controller';

// Not: authPlugin yalnızca config.auth === true olan rotaları korur.
// Bu rotalar public GET + public POST olacak şekilde bırakıldı.
// İstersen belirli POST'ları korumak için { config: { auth: true } } ekleyebilirsin.

export async function registerPayments(app: FastifyInstance) {
  // Providers
  app.get('/payment_providers', listPaymentProvidersHandler);
  app.get('/payment_providers/:key', getPaymentProviderByKeyHandler);

  // Payment Requests
  app.get('/payment_requests', listPaymentRequestsHandler);
  app.post('/payment_requests', createPaymentRequestHandler);

  // Payment Sessions
  app.post('/payment_sessions', createPaymentSessionHandler);
  app.get('/payment_sessions/:id', getPaymentSessionByIdHandler);
  app.post('/payment_sessions/:id/capture', capturePaymentSessionHandler);
  app.post('/payment_sessions/:id/cancel', cancelPaymentSessionHandler);
}
