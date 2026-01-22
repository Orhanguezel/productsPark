// ===================================================================
// FILE: src/modules/webhook/controller.ts
// FINAL — Telegram webhook controller
// - Public endpoint
// - Zod validate
// - Always 200 OK (Telegram retry yapmasın diye)
// ===================================================================

import type { RouteHandler } from 'fastify';
import { TelegramUpdateSchema } from './validation';
import { handleTelegramWebhookUpdate } from './service';

export const telegramWebhookCtrl: RouteHandler = async (req, reply) => {
  try {
    const body = (req as any).body ?? {};
    const update = TelegramUpdateSchema.parse(body);

    await handleTelegramWebhookUpdate(update);
    return reply.code(200).send({ ok: true });
  } catch (e: any) {
    req.log?.error?.(e, 'POST /webhooks/telegram failed');
    return reply.code(200).send({ ok: true });
  }
};
