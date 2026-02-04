// ===================================================================
// FILE: src/modules/payments/admin.routes.ts
// FINAL — Payments Admin routes (unchanged behavior, just clean)
// ===================================================================

import type { FastifyInstance } from 'fastify';

// Providers
import {
  listPaymentProvidersAdminHandler,
  getPaymentProviderAdminByIdHandler,
  createPaymentProviderAdminHandler,
  updatePaymentProviderAdminHandler,
  deletePaymentProviderAdminHandler,
} from './admin.providers.controller';

// Payment Requests
import {
  listPaymentRequestsAdminHandler,
  getPaymentRequestAdminByIdHandler,
  updatePaymentRequestAdminHandler,
  setPaymentRequestStatusAdminHandler,
  deletePaymentRequestAdminHandler,
} from './admin.paymentRequests.controller';

// Sessions
import {
  listPaymentSessionsAdminHandler,
  getPaymentSessionAdminByIdHandler,
  createPaymentSessionAdminHandler,
  capturePaymentSessionAdminHandler,
  cancelPaymentSessionAdminHandler,
  syncPaymentSessionAdminHandler,
} from './admin.sessions.controller';

// Payments
import {
  listPaymentsAdminHandler,
  getPaymentAdminByIdHandler,
  capturePaymentAdminHandler,
  refundPaymentAdminHandler,
  voidPaymentAdminHandler,
  syncPaymentAdminHandler,
  listPaymentEventsAdminHandler,
} from './admin.payments.controller';

const BASE = '/payment_providers';
const PAYMENT_REQUESTS_BASE = '/payment_requests';
const PAYMENT_SESSIONS_BASE = '/payment_sessions';
const PAYMENTS_BASE = '/payments';

export async function registerPaymentsAdmin(app: FastifyInstance) {
  // --- Payment Providers (admin) ---
  app.get(BASE, { config: { auth: true } }, listPaymentProvidersAdminHandler);
  app.get(`${BASE}/:id`, { config: { auth: true } }, getPaymentProviderAdminByIdHandler);
  app.post(BASE, { config: { auth: true } }, createPaymentProviderAdminHandler);
  app.patch(`${BASE}/:id`, { config: { auth: true } }, updatePaymentProviderAdminHandler);
  app.delete(`${BASE}/:id`, { config: { auth: true } }, deletePaymentProviderAdminHandler);

  // --- Payment Requests (admin) ---
  app.get(PAYMENT_REQUESTS_BASE, { config: { auth: true } }, listPaymentRequestsAdminHandler);
  app.get(
    `${PAYMENT_REQUESTS_BASE}/:id`,
    { config: { auth: true } },
    getPaymentRequestAdminByIdHandler,
  );
  app.patch(
    `${PAYMENT_REQUESTS_BASE}/:id`,
    { config: { auth: true } },
    updatePaymentRequestAdminHandler,
  );
  app.patch(
    `${PAYMENT_REQUESTS_BASE}/:id/status`,
    { config: { auth: true } },
    setPaymentRequestStatusAdminHandler,
  );
  app.delete(
    `${PAYMENT_REQUESTS_BASE}/:id`,
    { config: { auth: true } },
    deletePaymentRequestAdminHandler,
  );

  // --- Payment Sessions (admin) ---
  app.get(PAYMENT_SESSIONS_BASE, { config: { auth: true } }, listPaymentSessionsAdminHandler);
  app.get(
    `${PAYMENT_SESSIONS_BASE}/:id`,
    { config: { auth: true } },
    getPaymentSessionAdminByIdHandler,
  );
  app.post(PAYMENT_SESSIONS_BASE, { config: { auth: true } }, createPaymentSessionAdminHandler);
  app.post(
    `${PAYMENT_SESSIONS_BASE}/:id/capture`,
    { config: { auth: true } },
    capturePaymentSessionAdminHandler,
  );
  app.post(
    `${PAYMENT_SESSIONS_BASE}/:id/cancel`,
    { config: { auth: true } },
    cancelPaymentSessionAdminHandler,
  );
  app.post(
    `${PAYMENT_SESSIONS_BASE}/:id/sync`,
    { config: { auth: true } },
    syncPaymentSessionAdminHandler,
  );

  // --- Payments (admin) ---
  app.get(PAYMENTS_BASE, { config: { auth: true } }, listPaymentsAdminHandler);
  app.get(`${PAYMENTS_BASE}/:id`, { config: { auth: true } }, getPaymentAdminByIdHandler);
  app.post(`${PAYMENTS_BASE}/:id/capture`, { config: { auth: true } }, capturePaymentAdminHandler);
  app.post(`${PAYMENTS_BASE}/:id/refund`, { config: { auth: true } }, refundPaymentAdminHandler);
  app.post(`${PAYMENTS_BASE}/:id/void`, { config: { auth: true } }, voidPaymentAdminHandler);
  app.post(`${PAYMENTS_BASE}/:id/sync`, { config: { auth: true } }, syncPaymentAdminHandler);
  app.get(`${PAYMENTS_BASE}/:id/events`, { config: { auth: true } }, listPaymentEventsAdminHandler);
}
