// ===================================================================
// FILE: src/modules/telegram/controller.ts
// FINAL — Telegram controllers (admin tools: test/send/event)
// - NOTE: these are mounted under /admin/telegram/* via admin.routes.ts
// ===================================================================

import type { RouteHandler } from 'fastify';
import {
  TelegramSendBodySchema,
  TelegramEventBodySchema,
  TelegramTestBodySchema,
} from './validation';
import { sendTelegramGeneric, sendTelegramEvent, sendTelegramTest } from './service';

export const telegramTestCtrl: RouteHandler = async (req, reply) => {
  try {
    const body = TelegramTestBodySchema.parse((req as { body?: unknown }).body ?? {});
    const result = await sendTelegramTest(body.chat_id);
    return reply.code(200).send(result);
  } catch (e: unknown) {
    const err = e as { name?: string; issues?: unknown; message?: string };
    if (err?.name === 'ZodError') {
      return reply
        .code(400)
        .send({ error: { message: 'validation_error', details: (err as any).issues } });
    }
    req.log.error(e, 'POST /admin/telegram/test failed');
    return reply
      .code(500)
      .send({ error: { message: 'telegram_test_failed', details: err?.message } });
  }
};

export const telegramSendCtrl: RouteHandler = async (req, reply) => {
  try {
    const body = TelegramSendBodySchema.parse((req as { body?: unknown }).body ?? {});
    const result = await sendTelegramGeneric(body);
    return reply.code(201).send(result);
  } catch (e: unknown) {
    const err = e as { name?: string; issues?: unknown; message?: string };
    if (err?.name === 'ZodError') {
      return reply
        .code(400)
        .send({ error: { message: 'validation_error', details: (err as any).issues } });
    }
    req.log.error(e, 'POST /admin/telegram/send failed');
    return reply
      .code(500)
      .send({ error: { message: 'telegram_send_failed', details: err?.message } });
  }
};

export const telegramEventCtrl: RouteHandler = async (req, reply) => {
  try {
    const body = TelegramEventBodySchema.parse((req as { body?: unknown }).body ?? {});
    const result = await sendTelegramEvent(body);
    return reply.code(201).send(result);
  } catch (e: unknown) {
    const err = e as { name?: string; issues?: unknown; message?: string };
    if (err?.name === 'ZodError') {
      return reply
        .code(400)
        .send({ error: { message: 'validation_error', details: (err as any).issues } });
    }
    req.log.error(e, 'POST /admin/telegram/event failed');
    return reply
      .code(500)
      .send({ error: { message: 'telegram_event_failed', details: err?.message } });
  }
};
