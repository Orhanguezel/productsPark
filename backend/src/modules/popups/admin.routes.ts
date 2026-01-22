// =============================================================
// FILE: src/modules/popups/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  adminListPopups,
  adminGetPopup,
  adminCreatePopup,
  adminUpdatePopup,
  adminDeletePopup,
} from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";

export async function registerPopupsAdmin(app: FastifyInstance) {
  const base = "/popups";
  app.get(base,            { preHandler: [requireAuth] }, adminListPopups);
  app.get(`${base}/:id`,   { preHandler: [requireAuth] }, adminGetPopup);
  app.post(base,           { preHandler: [requireAuth] }, adminCreatePopup);
  app.patch(`${base}/:id`, { preHandler: [requireAuth] }, adminUpdatePopup);
  app.delete(`${base}/:id`,{ preHandler: [requireAuth] }, adminDeletePopup);
}
