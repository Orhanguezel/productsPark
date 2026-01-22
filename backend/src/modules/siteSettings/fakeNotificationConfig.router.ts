// src/modules/siteSettings/fakeNotificationConfig.router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { getFakeNotificationConfig, updateFakeNotificationConfig, publicGetFakeNotificationConfig } from "./fakeNotificationConfig.controller";

const ADMIN_BASE = "/admin/site-settings/fake-notification-config";
const BASE = "/site-settings/fake-notification-config";

export async function registerFakeNotificationConfig(app: FastifyInstance) {
  // ADMIN (auth)
  app.get(`${ADMIN_BASE}`, { preHandler: [requireAuth] }, getFakeNotificationConfig);
  app.put(`${ADMIN_BASE}`, { preHandler: [requireAuth] }, updateFakeNotificationConfig);

  // PUBLIC (no auth)
  app.get(`${BASE}`, publicGetFakeNotificationConfig);
}
