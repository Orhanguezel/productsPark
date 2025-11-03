// src/modules/fakeOrderNotifications/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListFakeOrders,
  adminGetFakeOrder,
  adminCreateFakeOrder,
  adminUpdateFakeOrder,
  adminDeleteFakeOrder,
  // ⬇️ bunlar eksikti
  publicListFakeOrders,
  publicRandomFakeOrder,
} from "./controller";

export async function registerFakeOrderNotifications(app: FastifyInstance) {
  // ADMIN (korumalı)
  app.get("/admin/fake-order-notifications", { preHandler: [requireAuth] }, adminListFakeOrders);
  app.get("/admin/fake-order-notifications/:id", { preHandler: [requireAuth] }, adminGetFakeOrder);
  app.post("/admin/fake-order-notifications", { preHandler: [requireAuth] }, adminCreateFakeOrder);
  app.put("/admin/fake-order-notifications/:id", { preHandler: [requireAuth] }, adminUpdateFakeOrder);
  app.delete("/admin/fake-order-notifications/:id", { preHandler: [requireAuth] }, adminDeleteFakeOrder);

  // PUBLIC (FE toast)
  app.get("/fake-order-notifications", publicListFakeOrders);
  app.get("/fake-order-notifications/random", publicRandomFakeOrder);
}
