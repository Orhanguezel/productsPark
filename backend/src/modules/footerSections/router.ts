import type { FastifyInstance } from "fastify";
import {
  listController,
  getController,
  createController,
  updateController,
  deleteController,
} from "./controller";

// İstersen auth middleware ekleyebilirsin:
// import { requireAuth } from '@/common/middleware/auth';

export async function registerFooterSections(app: FastifyInstance) {
  app.get("/footer_sections", /* { preHandler: [requireAuth] }, */ listController);
  app.get("/footer_sections/:id", /* { preHandler: [requireAuth] }, */ getController);
  app.post("/footer_sections", /* { preHandler: [requireAuth] }, */ createController);
  app.patch("/footer_sections/:id", /* { preHandler: [requireAuth] }, */ updateController);
  app.delete("/footer_sections/:id", /* { preHandler: [requireAuth] }, */ deleteController);
}
