import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListMenuItems,
  adminGetMenuItemById,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  adminReorderMenuItems,
} from "./admin.controller";

export async function registerMenuItemsAdmin(app: FastifyInstance) {
  app.get("/admin/menu_items", { preHandler: [requireAuth] }, adminListMenuItems);
  app.get("/admin/menu_items/:id", { preHandler: [requireAuth] }, adminGetMenuItemById);
  app.post("/admin/menu_items", { preHandler: [requireAuth] }, adminCreateMenuItem);
  app.patch("/admin/menu_items/:id", { preHandler: [requireAuth] }, adminUpdateMenuItem);
  app.delete("/admin/menu_items/:id", { preHandler: [requireAuth] }, adminDeleteMenuItem);

  // toplu sıralama
  app.post("/admin/menu_items/reorder", { preHandler: [requireAuth] }, adminReorderMenuItems);
}
