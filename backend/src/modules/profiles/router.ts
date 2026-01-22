// =============================================================
// FILE: src/modules/profiles/router.ts
// FINAL — add public GET /profiles/:id
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  getMyProfile,
  upsertMyProfile,
  getProfileByIdPublic,
  type ProfileUpsertRequest,
  type ProfileIdParams,
} from './controller';

const BASE = '/profiles';

export async function registerProfiles(app: FastifyInstance) {
  // ✅ Public: author profile for blog/news sidebar (NO auth)
  app.get<{ Params: ProfileIdParams }>(`${BASE}/:id`, getProfileByIdPublic);

  // Authenticated: my profile
  app.get(`${BASE}/me`, { preHandler: [requireAuth] }, getMyProfile);

  app.put<{ Body: ProfileUpsertRequest }>(
    `${BASE}/me`,
    { preHandler: [requireAuth] },
    upsertMyProfile,
  );
}
