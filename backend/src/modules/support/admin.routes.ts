import type { FastifyInstance } from "fastify";
import { SupportAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";
// Not: requireAdmin kullanıyorsan ekleyebilirsin.

export async function registerSupportAdmin(app: FastifyInstance) {
  const BASE = "/admin/support_tickets";

  // Tickets (admin)
  app.get(`${BASE}`, { preHandler: [requireAuth] }, SupportAdminController.list);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.get);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.update);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.remove);

  // :action = "close" | "reopen"
  app.post(`${BASE}/:id/:action`, { preHandler: [requireAuth] }, SupportAdminController.toggle);

  // Replies (admin)
  app.get(
    "/admin/ticket_replies/by-ticket/:ticketId",
    { preHandler: [requireAuth] },
    SupportAdminController.listReplies
  );
  app.post(
    "/admin/ticket_replies",
    { preHandler: [requireAuth] },
    SupportAdminController.createReply
  );
  app.delete(
    "/admin/ticket_replies/:id",
    { preHandler: [requireAuth] },
    SupportAdminController.removeReply
  );
}
