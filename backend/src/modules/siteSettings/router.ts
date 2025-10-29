// src/modules/siteSettings/router.ts

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listSiteSettings,
  getSiteSettingByKey,
  upsertSiteSetting,
  upsertManySiteSettings,
  deleteSiteSetting,
} from './controller';

export async function registerSiteSettings(app: FastifyInstance) {
  // public
  app.get('/site_settings', listSiteSettings);
  app.get('/site_settings/:key', getSiteSettingByKey);

  // admin ops (korumalı)
  app.put('/site_settings', { preHandler: [requireAuth] }, upsertSiteSetting);
  app.put('/site_settings/bulk', { preHandler: [requireAuth] }, upsertManySiteSettings);
  app.delete('/site_settings/:key', { preHandler: [requireAuth] }, deleteSiteSetting);
}
