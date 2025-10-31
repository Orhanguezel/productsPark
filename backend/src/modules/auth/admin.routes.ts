// src/modules/auth/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { makeAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

export async function registerUserAdmin(app: FastifyInstance) {
  const c = makeAdminController(app);

  // Hepsi admin korumalı
  const guard = { preHandler: [requireAuth, requireAdmin] as const };

  app.get("/admin/users", { preHandler: [requireAuth] }, c.list);
  app.get("/admin/users/:id", { preHandler: [requireAuth] }, c.get);

  app.patch("/admin/users/:id", { preHandler: [requireAuth] }, c.update);
  app.post("/admin/users/:id/active", { preHandler: [requireAuth] }, c.setActive);
  app.post("/admin/users/:id/roles", { preHandler: [requireAuth] }, c.setRoles);

  app.delete("/admin/users/:id", { preHandler: [requireAuth] }, c.remove);
}