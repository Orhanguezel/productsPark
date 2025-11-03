import type { FastifyInstance } from "fastify";
import { SupportAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";

export async function registerSupportAdmin(app: FastifyInstance) {


  // Tickets (admin)
  app.get("/admin/support_tickets", { preHandler: [requireAuth] }, SupportAdminController.list);
  app.get("/admin/support_tickets/:id", { preHandler: [requireAuth] }, SupportAdminController.get);
  app.patch("/admin/support_tickets/:id", { preHandler: [requireAuth] }, SupportAdminController.update);
  app.delete("/admin/support_tickets/:id", { preHandler: [requireAuth] }, SupportAdminController.remove);

  // :action = "close" | "reopen"
  app.post("/admin/support_tickets/:id/:action", { preHandler: [requireAuth] }, SupportAdminController.toggle);

  // Replies (admin)
  app.get("/admin/ticket_replies/by-ticket/:ticketId", { preHandler: [requireAuth] }, SupportAdminController.listReplies);
  app.post("/admin/ticket_replies", { preHandler: [requireAuth] }, SupportAdminController.createReply);
  app.delete("/admin/ticket_replies/:id", { preHandler: [requireAuth] }, SupportAdminController.removeReply);
}
