import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './controller';
import type { CategoryCreateInput, CategoryUpdateInput } from './validation';

export async function registerCategories(app: FastifyInstance) {
  // READ — public
  app.get('/categories', listCategories);
  app.get<{ Params: { id: string } }>('/categories/:id', getCategoryById);

  // WRITE — auth
  app.post<{ Body: CategoryCreateInput }>(
    '/categories',
    { preHandler: [requireAuth] },
    createCategory,
  );

  app.patch<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    '/categories/:id',
    { preHandler: [requireAuth] },
    updateCategory,
  );

  app.delete<{ Params: { id: string } }>(
    '/categories/:id',
    { preHandler: [requireAuth] },
    deleteCategory,
  );
}
