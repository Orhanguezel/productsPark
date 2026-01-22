// ===================================================================
// FILE: src/modules/webhook/service.ts
// FINAL — Telegram webhook service
// - Saves inbound messages to DB (idempotent)
// - Optional auto-reply (feature flag)
// - Reply uses telegramSendRaw (webhookEnabled gate)
// ===================================================================

import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { telegramInboundMessages } from '@/modules/telegram/schema';
import { getTelegramSettings, getSiteSettingsMap } from '@/modules/siteSettings/service';
import { telegramSendRaw } from '@/modules/telegram/telegram.notifier';
import type { TelegramUpdate } from './validation';

type HandleResult = { ok: true; handled: boolean; reason?: string };

const now = () => new Date();
const toChatIdString = (v: string | number) => String(v);

function pickIncomingMessage(update: TelegramUpdate) {
  return update.message ?? update.edited_message ?? update.callback_query?.message ?? undefined;
}

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

type AutoReplyConfig = {
  enabled: boolean;
  mode: 'echo' | 'simple'; // şimdilik iki mod
  template: string; // simple mod için
};

async function getAutoReplyConfig(): Promise<AutoReplyConfig> {
  // Bu keys’leri site_settings’e koyacağız (seed ile).
  const map = await getSiteSettingsMap([
    'telegram_autoreply_enabled',
    'telegram_autoreply_mode',
    'telegram_autoreply_template',
  ]);

  const enabledRaw = (map.get('telegram_autoreply_enabled') ?? '').trim().toLowerCase();
  const enabled = ['1', 'true', 'yes', 'on', 'y'].includes(enabledRaw);

  const modeRaw = (map.get('telegram_autoreply_mode') ?? 'simple').trim().toLowerCase();
  const mode: AutoReplyConfig['mode'] = modeRaw === 'echo' ? 'echo' : 'simple';

  const template =
    map.get('telegram_autoreply_template')?.trim() ||
    'Mesajınızı aldık. En kısa sürede dönüş yapacağız.';

  return { enabled, mode, template };
}

async function saveInboundMessage(update: TelegramUpdate): Promise<{
  chatId: string;
  text: string;
  alreadySaved: boolean;
}> {
  const msg = pickIncomingMessage(update);
  const text = (msg?.text ?? '').trim();
  const chatIdRaw = msg?.chat?.id;

  if (!msg || chatIdRaw == null) {
    return { chatId: '', text: '', alreadySaved: false };
  }

  const chatId = toChatIdString(chatIdRaw);
  const messageId = msg.message_id ?? null;

  // idempotent insert: uq(update_id, message_id)
  // message_id null ise unique çalışmaz; o yüzden null olanları da kaydediyoruz
  // ama "update_id unique" yapmıyoruz. Zaten çoğu update message_id ile gelir.
  try {
    await db.insert(telegramInboundMessages).values({
      id: randomUUID(),
      update_id: update.update_id,
      message_id: messageId ?? undefined,

      chat_id: chatId,
      chat_type: msg.chat.type ?? undefined,
      chat_title: msg.chat.title ?? undefined,
      chat_username: msg.chat.username ?? undefined,

      from_id: msg.from?.id != null ? String(msg.from.id) : undefined,
      from_username: msg.from?.username ?? undefined,
      from_first_name: msg.from?.first_name ?? undefined,
      from_last_name: msg.from?.last_name ?? undefined,
      from_is_bot: msg.from?.is_bot ? 1 : 0,

      text: text || undefined,
      raw: safeJsonStringify(update),

      telegram_date: msg.date ?? undefined,
      created_at: now(),
    });

    return { chatId, text, alreadySaved: false };
  } catch (e: any) {
    // Duplicate key ise idempotent kabul
    const msgTxt = String(e?.message ?? '');
    const isDup =
      msgTxt.includes('uq_tg_inbound_update_message') ||
      msgTxt.includes('Duplicate entry') ||
      msgTxt.includes('ER_DUP_ENTRY');

    if (isDup) {
      return { chatId, text, alreadySaved: true };
    }

    // diğer DB hataları: yukarı fırlatma yok, ama handled=false döneceğiz
    throw e;
  }
}

export async function handleTelegramWebhookUpdate(update: TelegramUpdate): Promise<HandleResult> {
  const tg = await getTelegramSettings();
  if (!tg.webhookEnabled) {
    return { ok: true, handled: false, reason: 'webhook_disabled' };
  }

  const msg = pickIncomingMessage(update);
  const chatIdRaw = msg?.chat?.id;

  if (!msg || chatIdRaw == null) {
    return { ok: true, handled: false, reason: 'no_message' };
  }

  // 1) Save inbound
  let saved: { chatId: string; text: string; alreadySaved: boolean };
  try {
    saved = await saveInboundMessage(update);
  } catch {
    return { ok: true, handled: false, reason: 'db_save_failed' };
  }

  const chatId = saved.chatId;
  const text = saved.text;

  // 2) No text => ignore (sticker/photo)
  if (!text) {
    return { ok: true, handled: false, reason: 'no_text' };
  }

  // 3) Auto reply (optional)
  try {
    const ar = await getAutoReplyConfig();
    if (!ar.enabled) return { ok: true, handled: true, reason: 'saved_only' };

    // Duplicate update için tekrar cevap yazma (spam önleme)
    if (saved.alreadySaved) {
      return { ok: true, handled: true, reason: 'already_saved_skip_reply' };
    }

    if (text === '/start') {
      await telegramSendRaw({
        chatId,
        text: 'Merhaba. Mesajınızı aldım. Birazdan dönüş yapacağız.',
      });
      return { ok: true, handled: true };
    }

    if (text === '/help') {
      await telegramSendRaw({
        chatId,
        text: 'Destek için mesajınızı yazın. Operatör en kısa sürede dönüş yapacaktır.',
      });
      return { ok: true, handled: true };
    }

    if (ar.mode === 'echo') {
      await telegramSendRaw({ chatId, text: `Mesajınız alındı: ${text}` });
      return { ok: true, handled: true };
    }

    // simple mode
    await telegramSendRaw({ chatId, text: ar.template });
    return { ok: true, handled: true };
  } catch {
    // Fail-safe: kayıt alınmış olabilir; reply başarısızsa sessizce geç
    return { ok: true, handled: true, reason: 'reply_failed' };
  }
}
