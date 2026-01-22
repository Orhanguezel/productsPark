// src/modules/fakeOrderNotifications/router.ts
import type { FastifyInstance } from "fastify";
import {
  publicListFakeOrders,
  publicRandomFakeOrder,
} from "./controller";

const BASE_PATH = "/fake-order-notifications";

export async function registerFakeOrderNotifications(app: FastifyInstance) {

  // PUBLIC (FE toast)
  app.get(`${BASE_PATH}`, publicListFakeOrders);
  app.get(`${BASE_PATH}/random`, publicRandomFakeOrder);
}
