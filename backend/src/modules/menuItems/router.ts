import type { FastifyInstance } from 'fastify';
import {
  listMenuItems,
  getMenuItemById,
} from './controller';

const BASE = '/menu_items';

export async function registerMenuItems(app: FastifyInstance) {
  // Varsayılan olarak public; ekstra config vermiyoruz.
  app.get(`${BASE}`, listMenuItems);
  app.get(`${BASE}/:id`, getMenuItemById);
}
