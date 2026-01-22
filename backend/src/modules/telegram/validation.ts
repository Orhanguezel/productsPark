// =============================================================
// FILE: src/modules/telegram/validation.ts
// FIX — TelegramEventBodySchema tek kaynak (no duplicate override)
// =============================================================

import { z } from 'zod';

/* ---------------- manual send ---------------- */

export const TelegramSendBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  type: z.string().trim().max(100).optional(),
  chat_id: z.string().trim().max(64).optional(),
});

export type TelegramSendBody = z.infer<typeof TelegramSendBodySchema>;

/* ---------------- event dispatcher ---------------- */

const baseEvent = z.object({
  chat_id: z.string().trim().max(64).optional(),
});

const zAmount = z.union([z.number(), z.string().trim().min(1)]);

const eventNewOrder = baseEvent.extend({
  event: z.literal('new_order'),
  data: z.object({
    order_number: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    final_amount: zAmount,
    order_items: z.string().trim().min(1),
    created_at: z.string().trim().min(1),

    customer_phone: z.string().trim().optional(),
    discount: z.string().trim().optional(),
  }),
});

const eventNewTicket = baseEvent.extend({
  event: z.literal('new_ticket'),
  data: z.object({
    user_name: z.string().trim().min(1),
    subject: z.string().trim().min(1),
    priority: z.string().trim().min(1),
    message: z.string().trim().min(1),
    created_at: z.string().trim().min(1),

    category: z.string().trim().optional(),
  }),
});

const eventTicketReplied = baseEvent.extend({
  event: z.literal('ticket_replied'),
  data: z.object({
    user_name: z.string().trim().min(1),
    subject: z.string().trim().min(1),
    priority: z.string().trim().min(1),
    message: z.string().trim().min(1),
    created_at: z.string().trim().min(1),

    category: z.string().trim().optional(),
  }),
});

const eventDepositApproved = baseEvent.extend({
  event: z.literal('deposit_approved'),
  data: z.object({
    // site_name notifier'dan da doldurulabilir; zorunlu yapmak istemiyorsan optional bırak.
    site_name: z.string().trim().min(1).optional(),
    user_name: z.string().trim().min(1),
    amount: zAmount,
    created_at: z.string().trim().min(1).optional(),
  }),
});

const eventNewDepositRequest = baseEvent.extend({
  event: z.literal('new_deposit_request'),
  data: z.object({
    site_name: z.string().trim().min(1).optional(),
    user_name: z.string().trim().min(1),
    amount: zAmount,
    payment_method: z.string().trim().min(1).optional(),
    created_at: z.string().trim().min(1).optional(),
  }),
});

const eventNewPaymentRequest = baseEvent.extend({
  event: z.literal('new_payment_request'),
  data: z.object({
    order_number: z.string().trim().min(1),
    customer_name: z.string().trim().min(1),
    customer_email: z.string().trim().min(1),
    amount: zAmount,
    payment_method: z.string().trim().min(1),
    order_items: z.string().trim().min(1),
    created_at: z.string().trim().min(1),

    customer_phone: z.string().trim().optional(),
  }),
});

/**
 * TEK KAYNAK: tüm event varyantları burada.
 * discriminatedUnion => TS inference doğru, controller hatası biter.
 */
export const TelegramEventBodySchema = z.discriminatedUnion('event', [
  eventNewOrder,
  eventNewTicket,
  eventTicketReplied,
  eventNewPaymentRequest,
  eventNewDepositRequest,
  eventDepositApproved,
]);

export type TelegramEventBody = z.infer<typeof TelegramEventBodySchema>;

/* ---------------- test ---------------- */

export const TelegramTestBodySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
});
export type TelegramTestBody = z.infer<typeof TelegramTestBodySchema>;

/* ---------------- inbound list ---------------- */

export const TelegramInboundListQuerySchema = z.object({
  chat_id: z.string().trim().max(64).optional(),
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().trim().max(500).optional(),
});
export type TelegramInboundListQuery = z.infer<typeof TelegramInboundListQuerySchema>;

/* ---------------- autoreply ---------------- */

export const TelegramAutoReplyUpdateBodySchema = z.object({
  enabled: z.boolean().optional(),
  template: z.string().trim().min(1).max(4000).optional(),
});
export type TelegramAutoReplyUpdateBody = z.infer<typeof TelegramAutoReplyUpdateBodySchema>;
