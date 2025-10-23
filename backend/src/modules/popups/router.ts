import type { FastifyInstance } from 'fastify';
import { listPopups, getPopupByKey } from './controller';
// (CRUD istersen auth korumalı create/update/delete da ekleriz)

export async function registerPopups(app: FastifyInstance) {
  // public
  app.get('/popups', listPopups);
  app.get('/popups/by-key/:key', getPopupByKey);
}
