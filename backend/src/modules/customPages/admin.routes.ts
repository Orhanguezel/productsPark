import type { FastifyInstance } from "fastify";
import {
  listPagesAdmin,
  getPageAdmin,
  getPageBySlugAdmin,
  createPageAdmin,
  updatePageAdmin,
  removePageAdmin,
} from "./admin.controller";

export async function registerCustomPagesAdmin(app: FastifyInstance) {
  app.get("/admin/custom_pages",               { config: { auth: true } }, listPagesAdmin);
  app.get("/admin/custom_pages/:id",           { config: { auth: true } }, getPageAdmin);
  app.get("/admin/custom_pages/by-slug/:slug", { config: { auth: true } }, getPageBySlugAdmin);

  app.post("/admin/custom_pages",              { config: { auth: true } }, createPageAdmin);
  app.patch("/admin/custom_pages/:id",         { config: { auth: true } }, updatePageAdmin);
  app.delete("/admin/custom_pages/:id",        { config: { auth: true } }, removePageAdmin);
}
