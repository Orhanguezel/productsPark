// src/modules/siteSettings/fakeNotificationConfig.router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { getFakeNotificationConfig, updateFakeNotificationConfig, publicGetFakeNotificationConfig } from "./fakeNotificationConfig.controller";

export async function registerFakeNotificationConfig(app: FastifyInstance) {
  // ADMIN (auth)
  app.get("/admin/site-settings/fake-notification-config", { preHandler: [requireAuth] }, getFakeNotificationConfig);
  app.put("/admin/site-settings/fake-notification-config", { preHandler: [requireAuth] }, updateFakeNotificationConfig);

  // PUBLIC (no auth)
  app.get("/site-settings/fake-notification-config", publicGetFakeNotificationConfig);
}
