// -------------------------------------------------------------
// FILE: src/modules/api_providers/router.ts
// -------------------------------------------------------------
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListApiProviders,
  adminGetApiProvider,
  adminCreateApiProvider,
  adminUpdateApiProvider,
  adminDeleteApiProvider,
} from "./controller";

export async function registerApiProviders(app: FastifyInstance) {
  // ADMIN (korumalı)
  app.get("/admin/api-providers", { preHandler: [requireAuth] }, adminListApiProviders);
  app.get("/admin/api-providers/:id", { preHandler: [requireAuth] }, adminGetApiProvider);
  app.post("/admin/api-providers", { preHandler: [requireAuth] }, adminCreateApiProvider);
  app.put("/admin/api-providers/:id", { preHandler: [requireAuth] }, adminUpdateApiProvider);
  app.delete("/admin/api-providers/:id", { preHandler: [requireAuth] }, adminDeleteApiProvider);
}
