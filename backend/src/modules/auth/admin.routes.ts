// src/modules/auth/admin.routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { makeAdminController } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

export async function registerUserAdmin(app: FastifyInstance) {
  const c = makeAdminController(app);
  const BASE = "/admin/users";

  // ✔ Tek preHandler: önce auth, sonra admin
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  app.get(`${BASE}`,               { preHandler: adminGuard }, c.list);
  app.get(`${BASE}/:id`,           { preHandler: adminGuard }, c.get);
  app.patch(`${BASE}/:id`,         { preHandler: adminGuard }, c.update);
  app.post(`${BASE}/:id/active`,   { preHandler: adminGuard }, c.setActive);
  app.post(`${BASE}/:id/roles`,    { preHandler: adminGuard }, c.setRoles);
  app.post(`${BASE}/:id/password`, { preHandler: adminGuard }, c.setPassword); // 🔐 yeni uç
  app.delete(`${BASE}/:id`,        { preHandler: adminGuard }, c.remove);
}
