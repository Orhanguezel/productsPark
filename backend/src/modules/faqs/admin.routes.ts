// src/modules/faqs/admin.routes.ts

import type { FastifyInstance } from "fastify";
import {
  listFaqsAdmin,
  getFaqAdmin,
  getFaqBySlugAdmin,
  createFaqAdmin,
  updateFaqAdmin,
  removeFaqAdmin,
} from "./admin.controller";

const BASE = "/faqs";

export async function registerFaqsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { auth: true } }, listFaqsAdmin);
  app.get(`${BASE}/:id`,           { config: { auth: true } }, getFaqAdmin);
  app.get(`${BASE}/by-slug/:slug`, { config: { auth: true } }, getFaqBySlugAdmin);

  app.post(`${BASE}`,              { config: { auth: true } }, createFaqAdmin);
  app.patch(`${BASE}/:id`,         { config: { auth: true } }, updateFaqAdmin);
  app.delete(`${BASE}/:id`,        { config: { auth: true } }, removeFaqAdmin);
}
