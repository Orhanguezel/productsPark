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

export async function registerSiteSettingsAdmin(app: FastifyInstance) {
  // Tüm admin uçları auth korumalı
  app.get('/admin/site_settings', { preHandler: [requireAuth] }, adminListSiteSettings);
  app.get('/admin/site_settings/:key', { preHandler: [requireAuth] }, adminGetSiteSettingByKey);

  app.post('/admin/site_settings', { preHandler: [requireAuth] }, adminCreateSiteSetting);
  app.put('/admin/site_settings/:key', { preHandler: [requireAuth] }, adminUpdateSiteSetting);

  app.post('/admin/site_settings/bulk-upsert', { preHandler: [requireAuth] }, adminBulkUpsertSiteSettings);

  // toplu silme (query filtreli) - FE geçiş süreci için gerekli
  app.delete('/admin/site_settings', { preHandler: [requireAuth] }, adminDeleteManySiteSettings);
  // tek kayıt silme
  app.delete('/admin/site_settings/:key', { preHandler: [requireAuth] }, adminDeleteSiteSetting);
}
