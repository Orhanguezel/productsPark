// =============================================================
// FILE: src/modules/siteSettings/router.ts (PUBLIC)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listSiteSettings,
  getSiteSettingByKey,
} from "./controller";

const BASE = "/site_settings";

export async function registerSiteSettings(app: FastifyInstance) {
  // Public read-only uçlar
  app.get(`${BASE}`,      { config: { public: true } }, listSiteSettings);
  app.get(`${BASE}/:key`, { config: { public: true } }, getSiteSettingByKey);
}
