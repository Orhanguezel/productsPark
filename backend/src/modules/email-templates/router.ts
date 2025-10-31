// =============================================================
// FILE: src/modules/email-templates/public.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listEmailTemplatesPublic,
  getEmailTemplateByKeyPublic,
  renderTemplateByKeyPublic,
} from "./controller";

export async function registerEmailTemplatesPublic(app: FastifyInstance) {
  app.get("/email_templates", listEmailTemplatesPublic);
  app.get("/email_templates/by-key/:key", getEmailTemplateByKeyPublic);
  app.post("/email_templates/by-key/:key/render", renderTemplateByKeyPublic);
}
