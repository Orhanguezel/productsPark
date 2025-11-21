// src/modules/support/controller.ts

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listTicketsQuerySchema,
  createTicketBodySchema,
  updateTicketBodySchema,
  createReplyBodySchema,
} from "./validation";
import { SupportRepo } from "./repository";

import { db } from "@/db/client";
import { users } from "@/modules/auth/schema";
import {
  notifications,
  type NotificationInsert,
} from "@/modules/notifications/schema";
import { randomUUID } from "crypto";
import { sendTicketRepliedMail } from "@/modules/mail/service";
import { eq } from "drizzle-orm";

/** Auth tarafında beklediğimiz user şekli (JWT payload) */
type AuthUser = {
  id?: string;
  role?: string;
} | undefined;

/* ========== ortak helpers (mail + notification için) ========== */

const now = () => new Date();

function getLocaleFromRequest(req: FastifyRequest | any): string | undefined {
  const header =
    (req.headers["x-locale"] as string | undefined) ||
    (req.headers["accept-language"] as string | undefined);

  if (!header) return undefined;
  const first = header.split(",")[0]?.trim();
  if (!first) return undefined;
  // email-templates locale max 10 char olarak tanımlı
  return first.slice(0, 10);
}

function buildDisplayNameFromUser(u: {
  full_name?: string | null;
  email?: string;
}): string {
  if (u.full_name && u.full_name.trim()) return u.full_name.trim();
  if (u.email) return u.email.split("@")[0] ?? u.email;
  return "Müşterimiz";
}

/**
 * ticket_replied template’i + notification
 *  - Hedef kullanıcı: ticket.userId
 *  - Sadece admin yanıtı için çağrılacak
 */
export async function fireTicketRepliedEventsForTicket(args: {
  req: FastifyRequest;
  ticketId: string;
  replyMessage: string;
}) {
  const { req, ticketId, replyMessage } = args;

  // 1) Ticket bilgisi
  const ticket = await SupportRepo.getById(ticketId);
  if (!ticket) return;

  // 2) Kullanıcı bilgisi
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, ticket.userId as any))
    .limit(1);

  if (!user || !user.email) return;

  const userName = buildDisplayNameFromUser({
    full_name: (user as any).full_name ?? null,
    email: (user as any).email,
  });

  const locale = getLocaleFromRequest(req);

  // 3) Notification kaydı
  try {
    const notif: NotificationInsert = {
      id: randomUUID(),
      user_id: user.id as any,
      title: "Destek talebiniz yanıtlandı",
      message: ticket.subject ?? "Destek talebiniz yanıtlandı.",
      type: "ticket_replied" as any,
      is_read: false,
      created_at: now(),
    };

    await db.insert(notifications).values(notif);
  } catch (err) {
    req.log?.error?.(err, "ticket_reply_notification_failed");
  }

  // 4) Mail gönderimi
  try {
    await sendTicketRepliedMail({
      to: (user as any).email,
      user_name: userName,
      ticket_id: ticket.id,
      ticket_subject: ticket.subject ?? "",
      reply_message: replyMessage,
      ...(locale ? { locale } : {}),
    });
  } catch (err) {
    req.log?.error?.(err, "ticket_reply_email_failed");
  }
}

/* ========== Controller ========== */

export const SupportController = {
  /** GET /support_tickets (public) */
  async listTickets(req: FastifyRequest, reply: FastifyReply) {
    try {
      const q = listTicketsQuerySchema.parse(req.query);
      const { data, total } = await SupportRepo.list(q);
      reply.header("x-total-count", String(total));
      return data;
    } catch (err) {
      req.log.error({ err }, "support_tickets_list_failed");
      reply.code(400);
      return { message: "Geçersiz istek." };
    }
  },

  /** GET /support_tickets/:id (public) */
  async getTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const row = await SupportRepo.getById(id);
      if (!row) {
        reply.code(404);
        return { message: "Kayıt bulunamadı." };
      }
      return row;
    } catch (err) {
      req.log.error({ err }, "support_tickets_get_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** POST /support_tickets (protected) */
  async createTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createTicketBodySchema.parse(req.body);
      const created = await SupportRepo.createTicket({
        user_id: body.user_id,
        subject: body.subject,
        message: body.message,
        priority: body.priority,
      });
      reply.code(201);
      return created;
    } catch (err) {
      req.log.error({ err }, "support_tickets_create_failed");
      reply.code(400);
      return { message: "Kayıt oluşturulamadı." };
    }
  },

  /** PATCH /support_tickets/:id (protected, RBAC içeride) */
  async updateTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const patch = updateTicketBodySchema.parse(req.body);

      const authUser = req.user as AuthUser;
      const role = (authUser?.role as string | undefined) ?? "user";

      if (role !== "admin" && ("status" in patch || "priority" in patch)) {
        reply.code(403);
        return { message: "Bu alanları güncelleme yetkiniz yok." };
      }

      const updated = await SupportRepo.updateTicket(id, {
        subject: patch.subject,
        message: patch.message,
        status: patch.status as any,
        priority: patch.priority as any,
      });

      if (!updated) {
        reply.code(404);
        return { message: "Kayıt bulunamadı." };
      }
      return updated;
    } catch (err) {
      req.log.error({ err }, "support_tickets_update_failed");
      reply.code(400);
      return { message: "Güncelleme başarısız." };
    }
  },

  /** GET /ticket_replies/by-ticket/:ticketId (public) */
  async listRepliesByTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { ticketId } = req.params as { ticketId: string };
      const rows = await SupportRepo.listRepliesByTicket(ticketId);
      return rows;
    } catch (err) {
      req.log.error({ err }, "ticket_replies_list_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** POST /ticket_replies (protected) */
  async createReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createReplyBodySchema.parse(req.body);

      const authUser = req.user as AuthUser;
      const role = (authUser?.role as string | undefined) ?? "user";
      const userId =
        (authUser?.id as string | undefined) ?? body.user_id ?? null;

      const created = await SupportRepo.createReply({
        ticket_id: body.ticket_id,
        user_id: role === "admin" ? (body.user_id ?? userId) : userId,
        message: body.message,
        is_admin: role === "admin" ? (body.is_admin ?? true) : false,
      });

      // ✅ KURAL: admin yanıtı → waiting_response, kullanıcı yanıtı → in_progress
      const nextStatus =
        role === "admin" ? "waiting_response" : "in_progress";
      await SupportRepo.updateTicket(body.ticket_id, {
        status: nextStatus as any,
      });

      // 🔔 Admin yanıtı için notification + mail
      if (role === "admin") {
        try {
          await fireTicketRepliedEventsForTicket({
            req,
            ticketId: body.ticket_id,
            replyMessage: body.message,
          });
        } catch (err) {
          req.log.error({ err }, "ticket_replied_side_effects_failed");
        }
      }

      reply.code(201);
      return created;
    } catch (err) {
      req.log.error({ err }, "ticket_replies_create_failed");
      reply.code(400);
      return { message: "Yanıt oluşturulamadı." };
    }
  },
};
