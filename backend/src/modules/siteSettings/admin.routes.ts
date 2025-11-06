import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
} from './admin.controller';

const BASE = '/admin/site_settings';

export async function registerSiteSettingsAdmin(app: FastifyInstance) {
  // Tüm admin uçları auth korumalı
  app.get(`${BASE}`, { preHandler: [requireAuth] }, adminListSiteSettings);
  app.get(`${BASE}/:key`, { preHandler: [requireAuth] }, adminGetSiteSettingByKey);

  app.post(`${BASE}`, { preHandler: [requireAuth] }, adminCreateSiteSetting);
  app.put(`${BASE}/:key`, { preHandler: [requireAuth] }, adminUpdateSiteSetting);

  app.post(`${BASE}/bulk-upsert`, { preHandler: [requireAuth] }, adminBulkUpsertSiteSettings);

  // toplu silme (query filtreli) - FE geçiş süreci için gerekli
  app.delete(`${BASE}`, { preHandler: [requireAuth] }, adminDeleteManySiteSettings);
  // tek kayıt silme
  app.delete(`${BASE}/:key`, { preHandler: [requireAuth] }, adminDeleteSiteSetting);
}
