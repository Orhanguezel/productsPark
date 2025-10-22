import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { getMyProfile, upsertMyProfile, type ProfileUpsertRequest } from '@/modules/profiles/controller';

export async function registerProfiles(app: FastifyInstance) {
  app.get('/profiles/v1/me', { preHandler: [requireAuth] }, getMyProfile);

  app.put<{ Body: ProfileUpsertRequest }>(
    '/profiles/v1/me',
    { preHandler: [requireAuth] },
    upsertMyProfile,
  );
}
