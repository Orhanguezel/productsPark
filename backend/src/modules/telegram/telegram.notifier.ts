// =============================================================
// FILE: src/modules/telegram/telegram.notifier.ts
// FINAL — Telegram notifier (site_settings templates + flags)
// - Export telegramSendRaw (import crash fix)
// - Placeholder values are escaped to avoid breaking Markdown
// - Fail-safe: never throws; logs errors for debugging
// =============================================================

import { getTelegramSettings, type TelegramEvent } from '@/modules/siteSettings/service';

type TelegramNotifyInput =
  | {
      event: TelegramEvent;
      chatId?: string; // override
      data: Record<string, unknown>; // template placeholders
    }
  | {
      // Backward compatible / generic
      title: string;
      message: string;
      type?: string;
      createdAt?: Date;
      chatId?: string;
    };

/**
 * Telegram "Markdown" (legacy parse_mode: 'Markdown') için güvenli escape.
 * Template’in kendi *bold* formatını bozmayalım diye sadece placeholder değerlerini escape ediyoruz.
 */
const escapeTelegramMarkdown = (text: string): string => {
  return text.replace(/([\\_*`\[\]])/g, '\\$1');
};

const renderTemplate = (tpl: string, data: Record<string, unknown>): string => {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = (data as Record<string, unknown>)[key];
    if (v === null || typeof v === 'undefined') return '';
    if (v instanceof Date) return escapeTelegramMarkdown(v.toISOString());
    return escapeTelegramMarkdown(String(v));
  });
};

const defaultFallbackMessage = (input: { title: string; message: string }): string => {
  const title = escapeTelegramMarkdown(input.title);
  const message = escapeTelegramMarkdown(input.message);
  return `🔔 *${title}*\n\n${message}`;
};

async function sendTelegramMessage(opts: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${opts.botToken}/sendMessage`;

  const payload = {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: 'Markdown' as const,
    disable_web_page_preview: true,
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`telegram_send_failed status=${r.status} body=${body}`);
  }
}

function isEventAllowed(
  events: Partial<Record<TelegramEvent, boolean>> | undefined,
  event: TelegramEvent,
): boolean {
  // Backward compat: key yoksa engelleme (undefined => allow)
  if (!events) return true;
  const v = events[event];
  if (typeof v === 'boolean') return v;
  return true;
}

/**
 * RAW send for webhook replies / inbound messaging.
 * - Checks only botToken + webhookEnabled
 * - DOES NOT depend on telegram_notifications_enabled or per-event flags
 * - IMPORTANT: Escapes Markdown to avoid broken messages
 */
export async function telegramSendRaw(input: { chatId: string; text: string }): Promise<void> {
  try {
    const cfg = await getTelegramSettings();
    if (!cfg.webhookEnabled) return;
    if (!cfg.botToken) return;

    // Markdown parse_mode aktif olduğu için escape zorunlu
    const safeText = escapeTelegramMarkdown(String(input.text ?? ''));

    await sendTelegramMessage({
      botToken: cfg.botToken,
      chatId: input.chatId,
      text: safeText,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('telegram_send_raw_failed', err);
    return;
  }
}


export async function telegramNotify(input: TelegramNotifyInput): Promise<void> {
  try {
    const cfg = await getTelegramSettings();

    if (!cfg.enabled) return;
    if (!cfg.botToken) return;

    // 1) Event template path
    if ('event' in input) {
      const event: TelegramEvent = input.event;

      if (!isEventAllowed(cfg.events, event)) return;

      const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
      if (!chatId) return;

      const tpl = (cfg.templates?.[event] ?? '').trim();

      const text = tpl
        ? renderTemplate(tpl, input.data)
        : renderTemplate(`🔔 *${event}*\n\n{{message}}`, {
            ...input.data,
            message: (input.data as Record<string, unknown>)?.message ?? '',
          });

      await sendTelegramMessage({
        botToken: cfg.botToken,
        chatId,
        text,
      });

      return;
    }

    // 2) Generic path
    const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
    if (!chatId) return;

    const text = defaultFallbackMessage({
      title: input.title,
      message: input.message,
    });

    await sendTelegramMessage({
      botToken: cfg.botToken,
      chatId,
      text,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('telegram_notify_failed', err);
  }
}
