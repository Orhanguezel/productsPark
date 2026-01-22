// ===================================================================
// FILE: src/modules/newsletter/admin.routes.ts
// FINAL — Newsletter Admin Routes
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listNewsletterAdmin,
  getNewsletterAdmin,
  updateNewsletterAdmin,
  removeNewsletterAdmin,
} from './admin.controller';

const BASE = '/newsletter';

export async function registerNewsletterAdmin(app: FastifyInstance) {
  app.get(`${BASE}`, { preHandler: [requireAuth] }, listNewsletterAdmin);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getNewsletterAdmin);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateNewsletterAdmin);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, removeNewsletterAdmin);
}
