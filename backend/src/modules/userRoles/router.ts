import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  listUserRoles,
  createUserRole,
  deleteUserRole,
} from "./controller";

export async function registerUserRoles(app: FastifyInstance) {
  // Public list (nav bar check) - limit + rateLimit ekleyelim
  app.get("/user_roles",
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    listUserRoles
  );

  // Yönetim uçları: admin zorunlu
  app.post("/user_roles",
    { preHandler: [requireAuth, requireAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    createUserRole
  );

  app.delete("/user_roles/:id",
    { preHandler: [requireAuth, requireAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    deleteUserRole
  );
}
