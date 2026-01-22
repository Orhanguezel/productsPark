// ===================================================================
// FILE: src/modules/webhook/router.ts
// FINAL — Telegram webhook routes
// - POST /webhooks/telegram
// - Optional secret path: POST /webhooks/telegram/:secret
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { telegramWebhookCtrl } from './controller';

const BASE = '/webhooks/telegram';

export async function registerTelegramWebhook(app: FastifyInstance) {
  app.post(`${BASE}`, telegramWebhookCtrl);

  app.post<{ Params: { secret: string } }>(`${BASE}/:secret`, async (req, reply) => {
    const secret = (req.params as any)?.secret;
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expected && secret !== expected) {
      return reply.code(200).send({ ok: true });
    }

    return telegramWebhookCtrl.call(app, req, reply);

  });
}
