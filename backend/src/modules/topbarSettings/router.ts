// modules/topbar/router.ts (public)
import type { FastifyInstance } from 'fastify';
import {
  listTopbarSettings,
  getTopbarSettingById,
} from './controller';
import type { TopbarPublicListQuery } from './validation';

export async function registerTopbar(app: FastifyInstance) {
  app.get<{ Querystring: TopbarPublicListQuery }>('/topbar_settings', listTopbarSettings);
  app.get<{ Params: { id: string } }>('/topbar_settings/:id', getTopbarSettingById);
}
