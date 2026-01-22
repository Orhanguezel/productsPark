// =============================================================
// FILE: src/modules/functions/routes.ts
// FINAL — add telegram-send-test
// =============================================================
import type { FastifyInstance } from 'fastify';

import { paytrGetToken, paytrHavaleGetToken } from '@/modules/functions/paytr.controller';
import {
  shopierCreatePayment,
  shopierCallback,
  sendEmail,
  sendTestMail,
  manualDeliveryEmail,
  smmApiOrder,
  smmApiStatus,
  turkpinCreateOrder,
  turkpinGameList,
  turkpinProductList,
  turkpinBalance,
  deleteUserOrders,
  sitemap,
} from '@/modules/functions/functions.controller';

const FN_BASE = '/functions';

export async function registerFunctions(app: FastifyInstance) {
  app.post(`${FN_BASE}/paytr-get-token`, paytrGetToken);
  app.post(`${FN_BASE}/paytr-havale-get-token`, paytrHavaleGetToken);

  app.post(`${FN_BASE}/shopier-create-payment`, shopierCreatePayment);
  app.post(`${FN_BASE}/shopier-callback`, shopierCallback);

  app.post(`${FN_BASE}/send-email`, sendEmail);
  app.post(`${FN_BASE}/send-test-mail`, sendTestMail);
  app.post(`${FN_BASE}/manual-delivery-email`, manualDeliveryEmail);

  app.post(`${FN_BASE}/smm-api-order`, smmApiOrder);
  app.post(`${FN_BASE}/smm-api-status`, smmApiStatus);

  app.post(`${FN_BASE}/turkpin-create-order`, turkpinCreateOrder);
  app.post(`${FN_BASE}/turkpin-game-list`, turkpinGameList);
  app.post(`${FN_BASE}/turkpin-product-list`, turkpinProductList);
  app.post(`${FN_BASE}/turkpin-balance`, turkpinBalance);

  app.post(`${FN_BASE}/delete-user-orders`, deleteUserOrders);

  app.get(`${FN_BASE}/sitemap`, sitemap);
}
