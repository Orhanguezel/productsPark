// =============================================================
// FILE: src/integrations/types/telegram.ts
// FINAL — Telegram Admin API types (matches BE zod validation)
// =============================================================

import type { SimpleSuccessResp } from '@/integrations/types/functions';

/**
 * POST /admin/telegram/send
 * BE: TelegramSendBodySchema
 */
export type TelegramAdminSendBody = {
  title: string; // min 1 max 200
  message: string; // min 1 max 4000
  type?: string; // max 100
  chat_id?: string; // max 50 (optional override)
};

/**
 * POST /admin/telegram/event
 * BE: TelegramEventBodySchema
 */
export type TelegramAdminEventBody = {
  event: string; // min 1 max 100 (BE TelegramEvent union ama schema string)
  chat_id?: string; // max 50
  data?: Record<string, unknown>; // default {}
};

/**
 * POST /admin/telegram/test
 * BE: TelegramTestBodySchema
 */
export type TelegramAdminTestBody = {
  chat_id?: string; // max 50
};

/**
 * Responses
 * BE send/test/event service return: { ok: true }
 * Controller test: 200 { ok: true }
 * Controller send/event: 201 { ok: true }
 */
export type TelegramAdminTestResp = {
  ok: boolean;
  message?: string;
};

// Re-export commonly used response shape
export type TelegramAdminResp = SimpleSuccessResp;
