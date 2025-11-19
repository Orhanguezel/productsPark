// =============================================================
// FILE: src/modules/auth/routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { makeAuthController } from "./controller";
import { makeGoogleAuthController } from "./google.controller";

export async function registerAuth(app: FastifyInstance) {
  const c = makeAuthController(app);
  const g = makeGoogleAuthController(app);

  const BASE = "/auth";

  // Public
  app.post(
    `${BASE}/signup`,
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    c.signup,
  );
  app.post(
    `${BASE}/token`,
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    c.token,
  );
  app.post(
    `${BASE}/token/refresh`,
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    c.refresh,
  );

  // Google (ID token flow)
  app.post(
    `${BASE}/google`,
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    g.google,
  );

  // OAuth redirect flow
  app.post(
    `${BASE}/google/start`,
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    g.googleStart,
  );
  app.get(`${BASE}/google/callback`, g.googleCallback);

  // Authenticated-ish
  app.get(`${BASE}/user`, c.me);
  app.get(`${BASE}/status`, c.status);

  // Profile/account updates
  app.put(`${BASE}/user`, c.update);

  // Logout
  app.post(`${BASE}/logout`, c.logout);
}
