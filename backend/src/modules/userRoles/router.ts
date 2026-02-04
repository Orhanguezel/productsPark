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
    listUserRoles
  );

  // Yönetim uçları: admin zorunlu
  app.post("/user_roles",
    { preHandler: [requireAuth, requireAdmin]},
    createUserRole
  );

  app.delete("/user_roles/:id",
    { preHandler: [requireAuth, requireAdmin]},
    deleteUserRole
  );
}
