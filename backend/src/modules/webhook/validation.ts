// ===================================================================
// FILE: src/modules/webhook/validation.ts
// FINAL — Telegram webhook validations (zod)
// - Minimal Telegram Update doğrulaması (message/edited_message/callback_query)
// ===================================================================

import { z } from 'zod';

const TgChatSchema = z.object({
  id: z.union([z.number().int(), z.string()]),
  type: z.string().optional(),
  title: z.string().optional(),
  username: z.string().optional(),
});

const TgFromSchema = z
  .object({
    id: z.union([z.number().int(), z.string()]).optional(),
    is_bot: z.boolean().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    language_code: z.string().optional(),
  })
  .optional();

const TgMessageSchema = z.object({
  message_id: z.number().int().optional(),
  date: z.number().int().optional(),
  text: z.string().optional(),
  chat: TgChatSchema,
  from: TgFromSchema,
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number().int(),

  message: TgMessageSchema.optional(),
  edited_message: TgMessageSchema.optional(),

  callback_query: z
    .object({
      id: z.string().optional(),
      data: z.string().optional(),
      message: TgMessageSchema.optional(),
      from: TgFromSchema,
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;
