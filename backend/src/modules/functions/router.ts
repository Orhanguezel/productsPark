import type { FastifyInstance } from 'fastify';
import {
  paytrGetToken,
  paytrHavaleGetToken,
} from '@/modules/functions/paytr.controller';
import {
  shopierCreatePayment,
  shopierCallback,
  sendEmail,
  manualDeliveryEmail,
  sendTelegramNotification,
  smmApiOrder,
  smmApiStatus,
  turkpinCreateOrder,
} from '@/modules/functions/functions.controller';

export async function registerFunctions(app: FastifyInstance) {
  // PayTR
  app.post('/functions/v1/paytr-get-token', paytrGetToken);
  app.post('/functions/v1/paytr-havale-get-token', paytrHavaleGetToken);

  // Shopier
  app.post('/functions/v1/shopier-create-payment', shopierCreatePayment);
  app.post('/functions/v1/shopier-callback', shopierCallback);

  // E-posta / Telegram
  app.post('/functions/v1/send-email', sendEmail);
  app.post('/functions/v1/manual-delivery-email', manualDeliveryEmail);
  app.post('/functions/v1/send-telegram-notification', sendTelegramNotification);

  // SMM / Tedarikçi stub
  app.post('/functions/v1/smm-api-order', smmApiOrder);
  app.post('/functions/v1/smm-api-status', smmApiStatus);

  // Turkpin stub
  app.post('/functions/v1/turkpin-create-order', turkpinCreateOrder);
}
