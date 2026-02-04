// =============================================================
// FILE: src/modules/auth/router.ts
// FINAL — Auth routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import { makeAuthController } from './controller';

export async function registerAuth(app: FastifyInstance) {
  const c = makeAuthController(app);
  const BASE = '/auth';

  // Public
  app.post(
    `${BASE}/signup`,
    c.signup,
  );

  app.post(
    `${BASE}/token`,
    c.token,
  );

  app.post(
    `${BASE}/token/refresh`,
    c.refresh,
  );

  // Password reset
  app.post(
    `${BASE}/password-reset/request`,
    c.passwordResetRequest,
  );
  app.post(
    `${BASE}/password-reset/confirm`,
    c.passwordResetConfirm,
  );

  // Authenticated-ish
  app.get(`${BASE}/user`, c.me);
  app.get(`${BASE}/status`, c.status);

  // Account updates
  app.put(`${BASE}/user`, c.update);

  // Logout
  app.post(`${BASE}/logout`, c.logout);
}
