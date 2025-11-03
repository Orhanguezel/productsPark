// src/modules/payments/admin.routes.ts

import type { FastifyInstance } from 'fastify';
import {
  // Providers
  listPaymentProvidersAdminHandler,
  getPaymentProviderAdminByIdHandler,
  createPaymentProviderAdminHandler,
  updatePaymentProviderAdminHandler,
  deletePaymentProviderAdminHandler,
  // Payment Requests
  listPaymentRequestsAdminHandler,
  getPaymentRequestAdminByIdHandler,
  updatePaymentRequestAdminHandler,
  setPaymentRequestStatusAdminHandler,
  deletePaymentRequestAdminHandler,
  // Sessions
  listPaymentSessionsAdminHandler,
  getPaymentSessionAdminByIdHandler,
  createPaymentSessionAdminHandler,   // <-- eklendi
  capturePaymentSessionAdminHandler,
  cancelPaymentSessionAdminHandler,
  syncPaymentSessionAdminHandler,
  // Payments
  listPaymentsAdminHandler,
  getPaymentAdminByIdHandler,
  capturePaymentAdminHandler,
  refundPaymentAdminHandler,
  voidPaymentAdminHandler,
  syncPaymentAdminHandler,
  listPaymentEventsAdminHandler,
} from './admin.controller';

export async function registerPaymentsAdmin(app: FastifyInstance) {
  // --- Payment Providers (admin) ---
  app.get('/admin/payment_providers', { config: { auth: true } }, listPaymentProvidersAdminHandler);
  app.get('/admin/payment_providers/:id', { config: { auth: true } }, getPaymentProviderAdminByIdHandler);
  app.post('/admin/payment_providers', { config: { auth: true } }, createPaymentProviderAdminHandler);
  app.patch('/admin/payment_providers/:id', { config: { auth: true } }, updatePaymentProviderAdminHandler);
  app.delete('/admin/payment_providers/:id', { config: { auth: true } }, deletePaymentProviderAdminHandler);

  // --- Payment Requests (admin) ---
  app.get('/admin/payment_requests', { config: { auth: true } }, listPaymentRequestsAdminHandler);
  app.get('/admin/payment_requests/:id', { config: { auth: true } }, getPaymentRequestAdminByIdHandler);
  app.patch('/admin/payment_requests/:id', { config: { auth: true } }, updatePaymentRequestAdminHandler);
  app.patch('/admin/payment_requests/:id/status', { config: { auth: true } }, setPaymentRequestStatusAdminHandler);
  app.delete('/admin/payment_requests/:id', { config: { auth: true } }, deletePaymentRequestAdminHandler);

  // --- Payment Sessions (admin) ---
  app.get('/admin/payment_sessions', { config: { auth: true } }, listPaymentSessionsAdminHandler);
  app.get('/admin/payment_sessions/:id', { config: { auth: true } }, getPaymentSessionAdminByIdHandler);
  app.post('/admin/payment_sessions', { config: { auth: true } }, createPaymentSessionAdminHandler); // <-- eklendi
  app.post('/admin/payment_sessions/:id/capture', { config: { auth: true } }, capturePaymentSessionAdminHandler);
  app.post('/admin/payment_sessions/:id/cancel',  { config: { auth: true } }, cancelPaymentSessionAdminHandler);
  app.post('/admin/payment_sessions/:id/sync',    { config: { auth: true } }, syncPaymentSessionAdminHandler);

  // --- Payments (admin) ---
  app.get('/admin/payments', { config: { auth: true } }, listPaymentsAdminHandler);
  app.get('/admin/payments/:id', { config: { auth: true } }, getPaymentAdminByIdHandler);
  app.post('/admin/payments/:id/capture', { config: { auth: true } }, capturePaymentAdminHandler);
  app.post('/admin/payments/:id/refund',  { config: { auth: true } }, refundPaymentAdminHandler);
  app.post('/admin/payments/:id/void',    { config: { auth: true } }, voidPaymentAdminHandler);
  app.post('/admin/payments/:id/sync',    { config: { auth: true } }, syncPaymentAdminHandler);
  app.get('/admin/payments/:id/events',   { config: { auth: true } }, listPaymentEventsAdminHandler);
}
