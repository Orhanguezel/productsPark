// src/modules/support/controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import {
  listTicketsQuerySchema,
  createTicketBodySchema,
  updateTicketBodySchema,
  createReplyBodySchema,
} from "./validation";
import { SupportRepo } from "./repository";

export const SupportController = {
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

  async getTicket(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
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

  async createTicket(req: FastifyRequest, reply: FastifyReply) {
    try {
      // Auth: request.user var sayıyoruz (authPlugin)
      // FE user_id gönderiyor; güvenlik için istersen burada request.user.id ile eşitleyebilirsin.
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

  async updateTicket(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const patch = updateTicketBodySchema.parse(req.body);

      // RBAC örneği: admin değilse status/priority güncelleyemesin
      // @ts-ignore
      const role = (req.user?.role as string | undefined) ?? "user";
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

  async listRepliesByTicket(req: FastifyRequest<{ Params: { ticketId: string } }>, reply: FastifyReply) {
    try {
      const { ticketId } = req.params;
      const rows = await SupportRepo.listRepliesByTicket(ticketId);
      return rows;
    } catch (err) {
      req.log.error({ err }, "ticket_replies_list_failed");
      reply.code(500);
      return { message: "İşlem gerçekleştirilemedi." };
    }
  },

  // src/modules/support/controller.ts
async createReply(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createReplyBodySchema.parse(req.body);
    // @ts-ignore
    const role = (req.user?.role as string | undefined) ?? "user";
    // @ts-ignore
    const userId = (req.user?.id as string | undefined) ?? body.user_id ?? null;

    const created = await SupportRepo.createReply({
      ticket_id: body.ticket_id,
      user_id: role === "admin" ? (body.user_id ?? userId) : userId,
      message: body.message,
      is_admin: role === "admin" ? (body.is_admin ?? true) : false,
    });

    // 🔹 Reply sonrası otomatik state transition
    const nextStatus = role === "admin" ? "waiting_response" : "in_progress";
    await SupportRepo.updateTicket(body.ticket_id, { status: nextStatus });

    reply.code(201);
    return created;
  } catch (err) {
    req.log.error({ err }, "ticket_replies_create_failed");
    reply.code(400);
    return { message: "Yanıt oluşturulamadı." };
  }
}
,
};
