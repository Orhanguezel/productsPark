// ===================================================================
// FILE: src/modules/newsletter/router.ts
// FINAL — Newsletter Public Routes
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { subscribeNewsletterPublic, unsubscribeNewsletterPublic } from './controller';

const BASE = '/newsletter';

export async function registerNewsletter(app: FastifyInstance) {
  app.post(`${BASE}/subscribe`, { config: { public: true } }, subscribeNewsletterPublic);
  app.post(`${BASE}/unsubscribe`, { config: { public: true } }, unsubscribeNewsletterPublic);
}
