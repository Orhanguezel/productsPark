import type { FastifyInstance } from "fastify";
import {
  listPagesAdmin,
  getPageAdmin,
  getPageBySlugAdmin,
  createPageAdmin,
  updatePageAdmin,
  removePageAdmin,
} from "./admin.controller";
const BASE_PATH = "/custom_pages";

export async function registerCustomPagesAdmin(app: FastifyInstance) {
  app.get(`${BASE_PATH}`,               { config: { auth: true } }, listPagesAdmin);
  app.get(`${BASE_PATH}/:id`,           { config: { auth: true } }, getPageAdmin);
  app.get(`${BASE_PATH}/by-slug/:slug`, { config: { auth: true } }, getPageBySlugAdmin);

  app.post(`${BASE_PATH}`,              { config: { auth: true } }, createPageAdmin);
  app.patch(`${BASE_PATH}/:id`,         { config: { auth: true } }, updatePageAdmin);
  app.delete(`${BASE_PATH}/:id`,        { config: { auth: true } }, removePageAdmin);
}
