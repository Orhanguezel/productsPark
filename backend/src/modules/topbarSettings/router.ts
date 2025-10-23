import type { FastifyInstance } from 'fastify';
import { listTopbarSettings } from './controller';

export async function registerTopbar(app: FastifyInstance) {
  app.get('/topbar_settings', listTopbarSettings);
}
