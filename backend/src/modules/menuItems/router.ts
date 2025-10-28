import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './controller';

export async function registerMenuItems(app: FastifyInstance) {
  // public
  app.get('/menu_items', listMenuItems);
  app.get('/menu_items/:id', getMenuItemById);

  // admin
  app.post('/menu_items', { preHandler: [requireAuth] }, createMenuItem);
  app.patch('/menu_items/:id', { preHandler: [requireAuth] }, updateMenuItem);
  app.delete('/menu_items/:id', { preHandler: [requireAuth] }, deleteMenuItem);
}
