// src/modules/storage/router.ts
import type { FastifyInstance } from 'fastify';
import { publicRedirect, handleUpload } from './controller';

export async function registerStorage(app: FastifyInstance) {
  app.get('/storage/v1/object/public/*', publicRedirect);
  app.post('/storage/v1/object/*', handleUpload);
}
