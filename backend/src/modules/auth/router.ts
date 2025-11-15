import type { FastifyInstance } from 'fastify';
import { makeAuthController } from './controller';

export async function registerAuth(app: FastifyInstance) {
  const c = makeAuthController(app);

  const BASE = '/auth/v1';

  // Public
  app.post(`${BASE}/signup`,        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.signup);
  app.post(`${BASE}/token`,         { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, c.token);
  app.post(`${BASE}/token/refresh`, { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, c.refresh);
  app.post(`${BASE}/google`,        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.google);

  // OAuth redirect flow
  app.post(`${BASE}/google/start`,  { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.googleStart);
  app.get(`${BASE}/google/callback`, c.googleCallback);

  // Authenticated-ish
  app.get(`${BASE}/user`,   c.me);
  app.get(`${BASE}/status`, c.status);

  // Profile/account updates
  app.put(`${BASE}/user`,   c.update);

  // Logout
  app.post(`${BASE}/logout`, c.logout);

}
