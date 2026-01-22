// src/modules/fakeOrderNotifications/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListFakeOrders,
  adminGetFakeOrder,
  adminCreateFakeOrder,
  adminUpdateFakeOrder,
  adminDeleteFakeOrder,
} from "./controller";

const BASE_PATH = "/fake-order-notifications";

export async function registerFakeOrderNotificationsAdmin(app: FastifyInstance) {
  // ADMIN (korumalı)
  app.get(`${BASE_PATH}`, { preHandler: [requireAuth] }, adminListFakeOrders);
  app.get(`${BASE_PATH}/:id`, { preHandler: [requireAuth] }, adminGetFakeOrder);
  app.post(`${BASE_PATH}`, { preHandler: [requireAuth] }, adminCreateFakeOrder);
  app.put(`${BASE_PATH}/:id`, { preHandler: [requireAuth] }, adminUpdateFakeOrder);
  app.delete(`${BASE_PATH}/:id`, { preHandler: [requireAuth] }, adminDeleteFakeOrder);
}
