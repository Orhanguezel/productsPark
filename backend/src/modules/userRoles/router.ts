import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  listUserRoles,
  createUserRole,
  deleteUserRole,
} from "./controller";

export async function registerUserRoles(app: FastifyInstance) {
  // public list (Navbar'da admin kontrolü için)
  app.get("/user_roles", listUserRoles);

  // yönetim (rol ekleme/çıkarma) – auth ile koru
  app.post("/user_roles", { preHandler: [requireAuth] }, createUserRole);
  app.delete("/user_roles/:id", { preHandler: [requireAuth] }, deleteUserRole);
}
