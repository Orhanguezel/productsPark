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

export async function registerFooterSectionsAdmin(app: FastifyInstance) {
  // LIST
  app.get<{ Querystring: AdminFooterSectionListQuery }>(
    "/admin/footer_sections",
    { preHandler: [requireAuth] },
    adminListFooterSections
  );

  // GET BY ID
  app.get<{ Params: { id: string } }>(
    "/admin/footer_sections/:id",
    { preHandler: [requireAuth] },
    adminGetFooterSectionById
  );

  // CREATE
  app.post<{ Body: AdminFooterSectionCreate }>(
    "/admin/footer_sections",
    { preHandler: [requireAuth] },
    adminCreateFooterSection
  );

  // UPDATE
  app.patch<{ Params: { id: string }; Body: AdminFooterSectionUpdate }>(
    "/admin/footer_sections/:id",
    { preHandler: [requireAuth] },
    adminUpdateFooterSection
  );

  // DELETE
  app.delete<{ Params: { id: string } }>(
    "/admin/footer_sections/:id",
    { preHandler: [requireAuth] },
    adminDeleteFooterSection
  );

  // REORDER
  app.post<{ Body: AdminFooterSectionReorder }>(
    "/admin/footer_sections/reorder",
    { preHandler: [requireAuth] },
    adminReorderFooterSections
  );
}
