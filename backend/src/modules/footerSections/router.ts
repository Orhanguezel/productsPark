// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/router.ts
// ----------------------------------------------------------------------
import type { FastifyInstance } from "fastify";
import {
  listController,
  getController,
  createController,
  updateController,
  deleteController,
} from "./controller";
import type {
  FooterSectionListQuery,
  FooterSectionCreateInput,
  FooterSectionUpdateInput,
} from "./validation";

export async function registerFooterSections(app: FastifyInstance) {
  // public
  app.get<{ Querystring: FooterSectionListQuery }>("/footer_sections", listController);
  app.get<{ Params: { id: string } }>("/footer_sections/:id", getController);

  // İstersen bu üç satırı kapat (public CRUD istenmiyorsa)
  app.post<{ Body: FooterSectionCreateInput }>("/footer_sections", createController);
  app.patch<{ Params: { id: string }; Body: FooterSectionUpdateInput }>("/footer_sections/:id", updateController);
  app.delete<{ Params: { id: string } }>("/footer_sections/:id", deleteController);
}
