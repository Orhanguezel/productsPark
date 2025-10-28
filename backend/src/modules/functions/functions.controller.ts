import type { FastifyReply, FastifyRequest } from 'fastify';

/** Shopier — FE beklediği shape: { success, form_action, form_data } */
export async function shopierCreatePayment(_req: FastifyRequest, reply: FastifyReply) {
  const oid = `SHP_${Date.now()}`;
  // Stub veriler
  const form_action = 'https://example.com/mock-shopier';
  const form_data: Record<string, string> = {
    oid,
    currency: 'TRY',
    amount: '0.00',
  };
  return reply.send({ success: true, form_action, form_data });
}

export async function shopierCallback(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ success: true });
}

/** Email / Telegram — sade başarı cevabı */
export async function sendEmail(req: FastifyRequest, reply: FastifyReply) {
  const { to, subject } = (req.body as { to?: string; subject?: string }) || {};
  req.log.info({ to, subject }, 'send-email stub');
  return reply.send({ success: true });
}

export async function manualDeliveryEmail(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'manual-delivery-email stub');
  return reply.send({ success: true });
}

export async function sendTelegramNotification(req: FastifyRequest, reply: FastifyReply) {
  const { chat_id, text } = (req.body as { chat_id?: string; text?: string }) || {};
  req.log.info({ chat_id, text }, 'telegram stub');
  return reply.send({ success: true });
}

/** SMM / Tedarikçi stub */
export async function smmApiOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-order stub');
  return reply.send({ success: true, order_id: `SMM_${Date.now()}`, status: 'processing' });
}

export async function smmApiStatus(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-status stub');
  return reply.send({ success: true, status: 'completed' });
}

/** Turkpin stub */
export async function turkpinCreateOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'turkpin-create-order stub');
  return reply.send({ success: true, order_id: `TP_${Date.now()}`, status: 'ok' });
}
