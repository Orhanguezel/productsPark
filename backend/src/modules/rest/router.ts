import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  getRest as getHandler,
  postRest as postHandler,
  patchRest as patchHandler,
  deleteRest as deleteHandler,
  RestParams,
  RestQuery,
} from '@/modules/rest/rest.controller';

export async function registerRest(app: FastifyInstance) {
  app.get<{ Params: RestParams; Querystring: RestQuery }>(
    '/rest/v1/:table',
    getHandler,
  );

  app.post<{ Params: RestParams }>(
    '/rest/v1/:table',
    { preHandler: [requireAuth] },
    postHandler,
  );

  app.patch<{ Params: RestParams; Querystring: RestQuery }>(
    '/rest/v1/:table',
    { preHandler: [requireAuth] },
    patchHandler,
  );

  app.delete<{ Params: RestParams; Querystring: RestQuery }>(
    '/rest/v1/:table',
    { preHandler: [requireAuth] },
    deleteHandler,
  );
}
