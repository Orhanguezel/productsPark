// src/modules/custom-pages/router.ts
import type { FastifyInstance } from "fastify";
import { listPages, getPage, getPageBySlug, createPage, updatePage, removePage } from "./controller";

export async function registerCustomPages(app: FastifyInstance) {
  app.get("/custom_pages",               { config: { public: true } }, listPages);
  app.get("/custom_pages/:id",           { config: { public: true } }, getPage);
  app.get("/custom_pages/by-slug/:slug", { config: { public: true } }, getPageBySlug);

  app.post("/custom_pages", createPage);
  app.patch("/custom_pages/:id", updatePage);
  app.delete("/custom_pages/:id", removePage);
}
