// src/modules/faqs/router.ts

import type { FastifyInstance } from "fastify";
import {
  listFaqsPublic,
  getFaqPublic,
  getFaqBySlugPublic,
} from "./controller";

const BASE = "/faqs";

export async function registerFaqs(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { public: true } }, listFaqsPublic);
  app.get(`${BASE}/:id`,           { config: { public: true } }, getFaqPublic);
  app.get(`${BASE}/by-slug/:slug`, { config: { public: true } }, getFaqBySlugPublic);
}
