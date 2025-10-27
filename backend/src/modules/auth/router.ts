import type { FastifyInstance } from 'fastify';
import { makeAuthController } from './controller';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

export async function registerAuth(app: FastifyInstance) {
  const c = makeAuthController(app);

  // Public
  app.post('/auth/v1/signup',        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.signup);
  app.post('/auth/v1/token',         { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, c.token);
  app.post('/auth/v1/token/refresh', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, c.refresh);
  app.post('/auth/v1/google',        { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.google);

  // OAuth redirect flow
  app.post('/auth/v1/google/start',  { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, c.googleStart);
  app.get('/auth/v1/google/callback', c.googleCallback);

  // Authenticated-ish
  app.get('/auth/v1/user',   c.me);
  app.get('/auth/v1/status', c.status);

  // Profile/account updates
  app.put('/auth/v1/user',   c.update);

  // Logout
  app.post('/auth/v1/logout', c.logout);

  // Admin
  app.get('/auth/v1/admin/users',        { preHandler: [requireAuth, requireAdmin] }, c.adminList);
  app.get('/auth/v1/admin/users/:id',    { preHandler: [requireAuth, requireAdmin] }, c.adminGet);
  app.post('/auth/v1/admin/roles',       { preHandler: [requireAuth, requireAdmin] }, c.adminGrantRole);
  app.delete('/auth/v1/admin/roles',     { preHandler: [requireAuth, requireAdmin] }, c.adminRevokeRole);
  app.post('/auth/v1/admin/make-admin',  { preHandler: [requireAuth, requireAdmin] }, c.adminMakeByEmail);
}
