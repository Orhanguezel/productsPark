// =============================================================
// FILE: src/modules/auth/admin.routes.ts
// FINAL — Admin Users routes (prefix: /admin beklenir)
// =============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { makeAdminController } from './admin.controller';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

export async function registerUserAdmin(app: FastifyInstance) {
  const c = makeAdminController(app);

  // Bu plugin /admin prefix'i ile register edilmeli => /admin/users
  const BASE = '/users';

  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  app.get(`${BASE}`, { preHandler: adminGuard }, c.list);
  app.get(`${BASE}/:id`, { preHandler: adminGuard }, c.get);
  app.patch(`${BASE}/:id`, { preHandler: adminGuard }, c.update);
  app.post(`${BASE}/:id/active`, { preHandler: adminGuard }, c.setActive);
  app.post(`${BASE}/:id/roles`, { preHandler: adminGuard }, c.setRoles);
  app.post(`${BASE}/:id/password`, { preHandler: adminGuard }, c.setPassword);
  app.delete(`${BASE}/:id`, { preHandler: adminGuard }, c.remove);
}
