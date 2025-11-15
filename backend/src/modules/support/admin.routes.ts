// src/modules/support/admin.routes.ts

import type { FastifyInstance } from "fastify";
import { SupportAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";

export async function registerSupportAdmin(app: FastifyInstance) {
  const BASE = "/admin/support_tickets";
  const REPLIES_BASE = "/admin/ticket_replies";

  // Tickets (admin)
  app.get(`${BASE}`, { preHandler: [requireAuth] }, SupportAdminController.list);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.get);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.update);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, SupportAdminController.remove);

  // :action = "close" | "reopen"
  app.post(`${BASE}/:id/:action`, { preHandler: [requireAuth] }, SupportAdminController.toggle);

  // Replies (admin)
  app.get(
    `${REPLIES_BASE}/by-ticket/:ticketId`,
    { preHandler: [requireAuth] },
    SupportAdminController.listReplies
  );
  app.post(
    `${REPLIES_BASE}`,
    { preHandler: [requireAuth] },
    SupportAdminController.createReply
  );
  app.delete(
    `${REPLIES_BASE}/:id`,
    { preHandler: [requireAuth] },
    SupportAdminController.removeReply
  );
}
