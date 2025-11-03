import type { FastifyInstance } from 'fastify';
import {
  listMenuItems,
  getMenuItemById,
} from './controller';

export async function registerMenuItems(app: FastifyInstance) {
  // Varsayılan olarak public; ekstra config vermiyoruz.
  app.get('/menu_items', listMenuItems);
  app.get('/menu_items/:id', getMenuItemById);
}
