// src/modules/api_providers/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListApiProviders,
  adminGetApiProvider,
  adminCreateApiProvider,
  adminUpdateApiProvider,
  adminDeleteApiProvider,
  adminCheckApiProviderBalance, // <-- NEW
} from "./controller";

const BASE = "/admin/api-providers";

export async function registerApiProviders(app: FastifyInstance) {
  app.get(`${BASE}`, { preHandler: [requireAuth] }, adminListApiProviders);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, adminGetApiProvider);
  app.post(`${BASE}`, { preHandler: [requireAuth] }, adminCreateApiProvider);
  app.put(`${BASE}/:id`, { preHandler: [requireAuth] }, adminUpdateApiProvider);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, adminDeleteApiProvider);

  // NEW: balance check
  app.post(`${BASE}/:id/check-balance`, { preHandler: [requireAuth] }, adminCheckApiProviderBalance);
}
