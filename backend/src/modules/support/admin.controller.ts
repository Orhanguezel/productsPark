// src/modules/support/admin.controller.ts

import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "@/db/client";
import { SupportRepo } from "./repository";
import { supportTickets, ticketReplies } from "./schema";
import { eq } from "drizzle-orm";
import {
  adminListQuerySchema,
  adminUpdateTicketBodySchema,
  adminCreateReplyBodySchema,
  adminActionSchema,
} from "./validation";
import { fireTicketRepliedEvents } from './controller';

export const SupportAdminController = {
  /** GET /admin/support_tickets */
  async list(req: FastifyRequest, reply: FastifyReply) {
    try {
      const q = adminListQuerySchema.parse(req.query);
      const { data, total } = await SupportRepo.list(q);
      reply.header("x-total-count", String(total));
      return data;
    } catch (err) {
      req.log.error({ err }, "admin_support_tickets_list_failed");
      reply.code(400);
      return { message: "Geçersiz istek." };
    }
  },

  /** GET /admin/support_tickets/:id */
  async get(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const row = await SupportRepo.getById(id);
      if (!row) {
        reply.code(404);
        return { message: "Kayıt bulunamadı." };
      }
      return row;
    } catch (err) {
      req.log.error({ err }, "admin_support_tickets_get_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** PATCH /admin/support_tickets/:id */
  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const patch = adminUpdateTicketBodySchema.parse(req.body);
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
      req.log.error({ err }, "admin_support_tickets_update_failed");
      reply.code(400);
      return { message: "Güncelleme başarısız." };
    }
  },

  /** DELETE /admin/support_tickets/:id */
  async remove(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      await db.delete(ticketReplies).where(eq(ticketReplies.ticketId, id));
      await db.delete(supportTickets).where(eq(supportTickets.id, id));

      reply.code(204);
      return null;
    } catch (err) {
      req.log.error({ err }, "admin_support_tickets_delete_failed");
      reply.code(500);
      return { message: "Silme işlemi başarısız." };
    }
  },

  /** POST /admin/support_tickets/:id/:action */
  async toggle(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, action } = req.params as { id: string; action: string };
      const act = adminActionSchema.parse(action);
      const status = act === "close" ? "closed" : "open";
      const updated = await SupportRepo.updateTicket(id, {
        status: status as any,
      });
      if (!updated) {
        reply.code(404);
        return { message: "Kayıt bulunamadı." };
      }
      return updated;
    } catch (err) {
      req.log.error({ err }, "admin_support_tickets_toggle_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** GET /admin/ticket_replies/by-ticket/:ticketId */
  async listReplies(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { ticketId } = req.params as { ticketId: string };
      const rows = await SupportRepo.listRepliesByTicket(ticketId);
      return rows;
    } catch (err) {
      req.log.error({ err }, "admin_ticket_replies_list_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** POST /admin/ticket_replies */
  async createReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = adminCreateReplyBodySchema.parse(req.body);
      const created = await SupportRepo.createReply({
        ticket_id: body.ticket_id,
        user_id: body.user_id ?? null,
        message: body.message,
        is_admin: true, // admin’den geldiği için true
      });

      // ✅ Admin yanıtı → "waiting_response" (cevaplandı, kullanıcıdan yanıt bekleniyor)
      await SupportRepo.updateTicket(body.ticket_id, {
        status: "waiting_response" as any,
      });

      // 🔔 Admin yanıtı → notification + mail
      try {
        await fireTicketRepliedEvents({
          req,
          ticketId: body.ticket_id,
          replyMessage: body.message,
        });
      } catch (err) {
        req.log.error({ err }, "admin_ticket_replied_side_effects_failed");
      }

      reply.code(201);
      return created;
    } catch (err) {
      req.log.error({ err }, "admin_ticket_replies_create_failed");
      reply.code(400);
      return { message: "Yanıt oluşturulamadı." };
    }
  },

  /** DELETE /admin/ticket_replies/:id */
  async removeReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      await db.delete(ticketReplies).where(eq(ticketReplies.id, id));
      reply.code(204);
      return null;
    } catch (err) {
      req.log.error({ err }, "admin_ticket_replies_delete_failed");
      reply.code(500);
      return { message: "Silme işlemi başarısız." };
    }
  },
};
