// modules/topbar/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListTopbar,
  adminGetTopbarById,
  adminCreateTopbar,
  adminUpdateTopbar,
  adminDeleteTopbar,
} from "./admin.controller";
import type {
  AdminTopbarListQuery,
  AdminTopbarCreate,
  AdminTopbarUpdate,
} from "./validation";


const BASE_ADMIN = "/topbar_settings";

export async function registerTopbarAdmin(app: FastifyInstance) {
  app.get<{ Querystring: AdminTopbarListQuery }>(
    `${BASE_ADMIN}`,
    { preHandler: [requireAuth] },
    adminListTopbar,
  );

  app.get<{ Params: { id: string } }>(
    `${BASE_ADMIN}/:id`,
    { preHandler: [requireAuth] },
    adminGetTopbarById,
  );

  app.post<{ Body: AdminTopbarCreate }>(
    `${BASE_ADMIN}`,
    { preHandler: [requireAuth] },
    adminCreateTopbar,
  );

  app.patch<{ Params: { id: string }; Body: AdminTopbarUpdate }>(
    `${BASE_ADMIN}/:id`,
    { preHandler: [requireAuth] },
    adminUpdateTopbar,
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE_ADMIN}/:id`,
    { preHandler: [requireAuth] },
    adminDeleteTopbar,
  );
}
