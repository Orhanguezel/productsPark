import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listPublishedPages,
  getPublishedPageBySlug,
  listCustomPages,
  getCustomPage,
  createCustomPage,
  updateCustomPage,
  softDeleteCustomPage,
  restoreCustomPage,
  listRevisions,
  getRevision,
  restoreToRevision,
} from './controller';

export async function registerCustomPages(app: FastifyInstance) {
  // Public
  app.get('/pages', listPublishedPages);
  app.get('/pages/:slug', getPublishedPageBySlug);

  // Admin (gerekirse extra admin guard ekle)
  app.get('/custom_pages', { preHandler: [requireAuth] }, listCustomPages);
  app.get('/custom_pages/:id', { preHandler: [requireAuth] }, getCustomPage);
  app.post('/custom_pages', { preHandler: [requireAuth] }, createCustomPage);
  app.patch('/custom_pages/:id', { preHandler: [requireAuth] }, updateCustomPage);

  // Soft delete & restore
  app.delete('/custom_pages/:id', { preHandler: [requireAuth] }, softDeleteCustomPage);
  app.post('/custom_pages/:id/restore', { preHandler: [requireAuth] }, restoreCustomPage);

  // Revisions
  app.get('/custom_pages/:id/versions', { preHandler: [requireAuth] }, listRevisions);
  app.get('/custom_pages/:id/versions/:version', { preHandler: [requireAuth] }, getRevision);
  app.post('/custom_pages/:id/versions/:version/restore', { preHandler: [requireAuth] }, restoreToRevision);
}
