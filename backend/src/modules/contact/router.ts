// =============================================================
// FILE: src/modules/contact/router.ts (PUBLIC)
// =============================================================
import type { FastifyInstance } from "fastify";
import { createContactPublic } from "./controller";

const BASE = "/contacts";

export async function registerContacts(app: FastifyInstance) {
  app.post(`${BASE}`, { config: { public: true } }, createContactPublic);
}
