import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "@/db/client";
import { SupportRepo } from "./repository";
import { supportTickets, ticketReplies } from "./schema";
import { eq } from "drizzle-orm";

// --- validations (admin tarafı) ---
const listQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z.enum(["open", "in_progress", "waiting_response", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const updateTicketBodySchema = z.object({
  subject: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().min(1).max(2000).optional(),
  status: z.enum(["open", "in_progress", "waiting_response", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z.string().trim().max(40).optional().nullable(), // şemada yok → ignore
}).refine((v) => Object.keys(v).length > 0, { message: "Boş patch gönderilemez." });

const createReplyBodySchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1).max(2000),
});

const actionSchema = z.enum(["close", "reopen"]);

// --- Controller (generic’siz FastifyRequest; params içeride cast edilir) ---
export const SupportAdminController = {
  /** GET /admin/support_tickets */
  async list(req: FastifyRequest, reply: FastifyReply) {
    try {
      const q = listQuerySchema.parse(req.query);
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
      const { id } = (req.params as { id: string });
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
      const { id } = (req.params as { id: string });
      const patch = updateTicketBodySchema.parse(req.body);
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
      const { id } = (req.params as { id: string });

      // önce replies
      await db.delete(ticketReplies).where(eq(ticketReplies.ticketId, id));
      // sonra ticket
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
      const { id, action } = (req.params as { id: string; action: string });
      const act = actionSchema.parse(action);
      const status = act === "close" ? "closed" : "open";
      const updated = await SupportRepo.updateTicket(id, { status: status as any });
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
      const { ticketId } = (req.params as { ticketId: string });
      const rows = await SupportRepo.listRepliesByTicket(ticketId);
      return rows; // camel döner; FE normalizer snake/camel okuyor
    } catch (err) {
      req.log.error({ err }, "admin_ticket_replies_list_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  /** POST /admin/ticket_replies */
  async createReply(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createReplyBodySchema.parse(req.body);
      const created = await SupportRepo.createReply({
        ticket_id: body.ticket_id,
        user_id: body.user_id ?? null,
        message: body.message,
        is_admin: true, // admin’den geldiği için true
      });
      // admin cevap verince bileti "waiting_response" yap (opsiyonel kural)
      await SupportRepo.updateTicket(body.ticket_id, { status: "waiting_response" as any });

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
      const { id } = (req.params as { id: string });
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
