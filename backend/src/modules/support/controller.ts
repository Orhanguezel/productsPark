// ===================================================================
// FILE: src/modules/support/controller.ts
// FINAL — Support Controller (Email + Telegram + Notifications)
// - CHANGE: createTicket => event 'new_ticket'
// - CHANGE: admin reply => event 'ticket_replied' (semantic separation)
// ===================================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  listTicketsQuerySchema,
  createTicketBodySchema,
  updateTicketBodySchema,
  createReplyBodySchema,
} from './validation';
import { SupportRepo } from './repository';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { notifications, type NotificationInsert } from '@/modules/notifications/schema';

import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import { sendTicketRepliedMail } from '@/modules/mail/service';
import { sendTelegramEvent } from '@/modules/telegram/service';

/** JWT payload */
type AuthUser =
  | {
      id?: string;
      role?: string;
    }
  | undefined;

const now = () => new Date();

function getLocaleFromRequest(req: FastifyRequest | any): string | undefined {
  const header =
    (req.headers['x-locale'] as string | undefined) ||
    (req.headers['accept-language'] as string | undefined);

  if (!header) return undefined;
  const first = header.split(',')[0]?.trim();
  return first ? first.slice(0, 10) : undefined;
}

function buildDisplayName(u: { full_name?: string | null; email?: string }): string {
  if (u.full_name && u.full_name.trim()) return u.full_name.trim();
  if (u.email) return u.email.split('@')[0] ?? u.email;
  return 'Müşterimiz';
}

async function insertNotificationSafe(args: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) {
  const notif: NotificationInsert = {
    id: randomUUID(),
    user_id: args.userId,
    title: args.title,
    message: args.message,
    type: args.type as any,
    is_read: 0,
    created_at: now(),
  };

  await db.insert(notifications).values(notif);
}

/* ===================================================================
   SIDE EFFECTS — ADMIN REPLY
   =================================================================== */

export async function fireTicketRepliedEvents(args: {
  req: FastifyRequest;
  ticketId: string;
  replyMessage: string;
}) {
  const { req, ticketId, replyMessage } = args;

  const ticket = await SupportRepo.getById(ticketId);
  if (!ticket) return;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, ticket.userId as any))
    .limit(1);

  if (!user || !(user as any).email) return;

  const userId = String(user.id);
  const email = String((user as any).email);
  const userName = buildDisplayName({
    full_name: (user as any).full_name ?? null,
    email,
  });

  const locale = getLocaleFromRequest(req);

  // Notification (DB)
  try {
    await insertNotificationSafe({
      userId,
      title: 'Destek talebiniz yanıtlandı',
      message: ticket.subject ?? 'Destek talebiniz yanıtlandı.',
      type: 'ticket_replied',
    });
  } catch (err) {
    req.log?.error?.(err, 'ticket_reply_notification_failed');
  }

  // Email
  try {
    await sendTicketRepliedMail({
      to: email,
      user_name: userName,
      ticket_id: ticket.id,
      ticket_subject: ticket.subject ?? '',
      reply_message: replyMessage,
      ...(locale ? { locale } : {}),
    });
  } catch (err) {
    req.log?.error?.(err, 'ticket_reply_email_failed');
  }

  // Telegram (NEW EVENT: ticket_replied)
  try {
    await sendTelegramEvent({
      event: 'ticket_replied',
      data: {
        user_name: userName,
        subject: ticket.subject ?? '',
        priority: ticket.priority ?? '',
        category: '',
        message: replyMessage,
        created_at: new Date().toISOString(),
      },
    });

    await insertNotificationSafe({
      userId,
      title: 'Telegram bildirimi gönderildi',
      message: 'Destek talebi yanıtı Telegram üzerinden iletildi.',
      type: 'ticket_telegram_sent',
    });
  } catch (err) {
    req.log?.error?.(err, 'ticket_reply_telegram_failed');
  }
}

/* ===================================================================
   CONTROLLER
   =================================================================== */

export const SupportController = {
  async listTickets(req: FastifyRequest, reply: FastifyReply) {
    try {
      const q = listTicketsQuerySchema.parse(req.query);
      const { data, total } = await SupportRepo.list(q);
      reply.header('x-total-count', String(total));
      return data;
    } catch (err) {
      req.log.error({ err }, 'support_tickets_list_failed');
      reply.code(400);
      return { message: 'Geçersiz istek.' };
    }
  },

  async getTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const row = await SupportRepo.getById(id);
      if (!row) {
        reply.code(404);
        return { message: 'Kayıt bulunamadı.' };
      }
      return row;
    } catch (err) {
      req.log.error({ err }, 'support_tickets_get_failed');
      reply.code(500);
      return { message: 'İşlem gerçekleştirilemedi.' };
    }
  },

  async createTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createTicketBodySchema.parse(req.body);
      const created = await SupportRepo.createTicket({
        user_id: body.user_id,
        subject: body.subject,
        message: body.message,
        priority: body.priority,
      });

      // Notification (ticket_created)
      try {
        await insertNotificationSafe({
          userId: body.user_id,
          title: 'Destek talebi oluşturuldu',
          message: body.subject,
          type: 'ticket_created',
        });
      } catch {}

      // Telegram: ticket create event -> NEW_TICKET
      try {
        const [u] = await db
          .select()
          .from(users)
          .where(eq(users.id, body.user_id as any))
          .limit(1);

        const email = (u as any)?.email ? String((u as any).email) : undefined;
        const userName = u
          ? buildDisplayName({ full_name: (u as any).full_name ?? null, email })
          : body.user_id;

        await sendTelegramEvent({
          event: 'new_ticket',
          data: {
            user_name: userName,
            subject: body.subject,
            priority: body.priority ?? 'medium',
            category: '',
            message: body.message,
            created_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        req.log?.error?.(err, 'ticket_create_telegram_failed');
      }

      reply.code(201);
      return created;
    } catch (err) {
      req.log.error({ err }, 'support_tickets_create_failed');
      reply.code(400);
      return { message: 'Kayıt oluşturulamadı.' };
    }
  },

  async updateTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const patch = updateTicketBodySchema.parse(req.body);

      const authUser = req.user as AuthUser;
      const role = (authUser?.role as string | undefined) ?? 'user';

      if (role !== 'admin' && ('status' in patch || 'priority' in patch)) {
        reply.code(403);
        return { message: 'Bu alanları güncelleme yetkiniz yok.' };
      }

      const updated = await SupportRepo.updateTicket(id, {
        subject: patch.subject,
        message: patch.message,
        status: patch.status as any,
        priority: patch.priority as any,
      });

      if (!updated) {
        reply.code(404);
        return { message: 'Kayıt bulunamadı.' };
      }

      return updated;
    } catch (err) {
      req.log.error({ err }, 'support_tickets_update_failed');
      reply.code(400);
      return { message: 'Güncelleme başarısız.' };
    }
  },

  async listRepliesByTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { ticketId } = req.params as { ticketId: string };
      const rows = await SupportRepo.listRepliesByTicket(ticketId);
      return rows;
    } catch (err) {
      req.log.error({ err }, 'ticket_replies_list_failed');
      reply.code(500);
      return { message: 'İşlem gerçekleştirilemedi.' };
    }
  },

  async createReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createReplyBodySchema.parse(req.body);

      const authUser = req.user as AuthUser;
      const role = (authUser?.role as string | undefined) ?? 'user';
      const userId = (authUser?.id as string | undefined) ?? body.user_id ?? null;

      const created = await SupportRepo.createReply({
        ticket_id: body.ticket_id,
        user_id: role === 'admin' ? body.user_id ?? userId : userId,
        message: body.message,
        is_admin: role === 'admin' ? body.is_admin ?? true : false,
      });

      const nextStatus = role === 'admin' ? 'waiting_response' : 'in_progress';
      await SupportRepo.updateTicket(body.ticket_id, { status: nextStatus as any });

      if (role === 'admin') {
        await fireTicketRepliedEvents({
          req,
          ticketId: body.ticket_id,
          replyMessage: body.message,
        });
      }

      reply.code(201);
      return created;
    } catch (err) {
      req.log.error({ err }, 'ticket_replies_create_failed');
      reply.code(400);
      return { message: 'Yanıt oluşturulamadı.' };
    }
  },
};
