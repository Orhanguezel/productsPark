// ===================================================================
// FILE: src/modules/telegram/service.ts
// FINAL — Telegram module services (templated + generic)
// ===================================================================

import { telegramNotify } from './telegram.notifier';
import type { TelegramSendBody, TelegramEventBody } from './validation';

/**
 * Generic message send (no template selection).
 * Uses telegramNotify backward-compatible path.
 */
export async function sendTelegramGeneric(input: TelegramSendBody) {
  await telegramNotify({
    title: input.title,
    message: input.message,
    type: input.type,
    chatId: input.chat_id,
    createdAt: new Date(),
  });

  return { ok: true };
}

/**
 * Template-based event send (site_settings templates + flags).
 * event string -> notifier TelegramEvent type (cast).
 * Notifier checks enabled + per-event flags + template existence.
 */
export async function sendTelegramEvent(input: TelegramEventBody) {
  await telegramNotify({
    event: input.event as any, // TelegramEvent (siteSettings/service) ile uyumlu varsayım
    chatId: input.chat_id,
    data: input.data ?? {},
  });

  return { ok: true };
}

/**
 * Simple test message to confirm bot token + chat_id works.
 */
export async function sendTelegramTest(chatId?: string) {
  await telegramNotify({
    title: 'Telegram Test',
    message: 'Telegram bildirim testi başarılı.',
    chatId,
    createdAt: new Date(),
  });

  return { ok: true };
}
