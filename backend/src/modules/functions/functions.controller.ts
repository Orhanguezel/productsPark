import type { FastifyReply, FastifyRequest } from 'fastify';

/** Shopier */
export async function shopierCreatePayment(_req: FastifyRequest, reply: FastifyReply) {
  const oid = `SHP_${Date.now()}`;
  return reply.send({
    data: {
      payment_url: `https://example.com/mock-shopier?oid=${oid}`,
      form_html: `<form action="https://example.com/mock-shopier" method="post"><input type="hidden" name="oid" value="${oid}" /></form>`,
    },
  });
}

export async function shopierCallback(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ data: { ok: true } });
}

/** Email / Telegram */
export async function sendEmail(req: FastifyRequest, reply: FastifyReply) {
  const { to, subject } = (req.body as any) || {};
  req.log.info({ to, subject }, 'send-email stub');
  return reply.send({ data: { ok: true } });
}

export async function manualDeliveryEmail(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'manual-delivery-email stub');
  return reply.send({ data: { ok: true } });
}

export async function sendTelegramNotification(req: FastifyRequest, reply: FastifyReply) {
  const { chat_id, text } = (req.body as any) || {};
  req.log.info({ chat_id, text }, 'telegram stub');
  return reply.send({ data: { ok: true } });
}

/** SMM / Tedarikçi stub */
export async function smmApiOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-order stub');
  return reply.send({ data: { order_id: `SMM_${Date.now()}`, status: 'processing' } });
}

export async function smmApiStatus(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-status stub');
  return reply.send({ data: { status: 'completed' } });
}

/** Turkpin stub */
export async function turkpinCreateOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'turkpin-create-order stub');
  return reply.send({ data: { order_id: `TP_${Date.now()}`, status: 'ok' } });
}
