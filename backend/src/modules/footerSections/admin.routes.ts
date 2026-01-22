// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/admin.router.ts
// ----------------------------------------------------------------------
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListFooterSections,
  adminGetFooterSectionById,
  adminCreateFooterSection,
  adminUpdateFooterSection,
  adminDeleteFooterSection,
  adminReorderFooterSections,
} from "./admin.controller";
import type {
  AdminFooterSectionListQuery,
  AdminFooterSectionCreate,
  AdminFooterSectionUpdate,
  AdminFooterSectionReorder,
} from "./validation";

const BASE = "/footer_sections";

export async function registerFooterSectionsAdmin(app: FastifyInstance) {
  // LIST
  app.get<{ Querystring: AdminFooterSectionListQuery }>(
    BASE,
    { preHandler: [requireAuth] },
    adminListFooterSections
  );

  // GET BY ID
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminGetFooterSectionById
  );

  // CREATE
  app.post<{ Body: AdminFooterSectionCreate }>(
    BASE,
    { preHandler: [requireAuth] },
    adminCreateFooterSection
  );

  // UPDATE
  app.patch<{ Params: { id: string }; Body: AdminFooterSectionUpdate }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminUpdateFooterSection
  );

  // DELETE
  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth] },
    adminDeleteFooterSection
  );

  // REORDER
  app.post<{ Body: AdminFooterSectionReorder }>(
    `${BASE}/reorder`,
    { preHandler: [requireAuth] },
    adminReorderFooterSections
  );
}
