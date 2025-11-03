import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListTopbar,
  adminGetTopbarById,
  adminCreateTopbar,
  adminUpdateTopbar,
  adminDeleteTopbar,
} from "./admin.controller";
import type { AdminTopbarListQuery, AdminTopbarCreate, AdminTopbarUpdate } from "./validation";

export async function registerTopbarAdmin(app: FastifyInstance) {
  app.get<{ Querystring: AdminTopbarListQuery }>("/admin/topbar_settings", { preHandler: [requireAuth] }, adminListTopbar);
  app.get<{ Params: { id: string } }>("/admin/topbar_settings/:id", { preHandler: [requireAuth] }, adminGetTopbarById);
  app.post<{ Body: AdminTopbarCreate }>("/admin/topbar_settings", { preHandler: [requireAuth] }, adminCreateTopbar);
  app.patch<{ Params: { id: string }; Body: AdminTopbarUpdate }>("/admin/topbar_settings/:id", { preHandler: [requireAuth] }, adminUpdateTopbar);
  app.delete<{ Params: { id: string } }>("/admin/topbar_settings/:id", { preHandler: [requireAuth] }, adminDeleteTopbar);
}
