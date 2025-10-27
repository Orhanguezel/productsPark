import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

import {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
} from './controller';

import type { CategoryCreateInput, CategoryUpdateInput } from './validation';
import {
  adminCreateCategory,
  adminPutCategory,
  adminPatchCategory,
  adminDeleteCategory,
  adminReorderCategories,
  adminToggleActive,
  adminToggleFeatured,
} from './admin.controller';

export async function registerCategories(app: FastifyInstance) {
  // PUBLIC READ
  app.get('/categories', { config: { public: true } }, listCategories);
  app.get<{ Params: { id: string } }>('/categories/:id', { config: { public: true } }, getCategoryById);
  app.get<{ Params: { slug: string } }>('/categories/by-slug/:slug', { config: { public: true } }, getCategoryBySlug);

  // ADMIN WRITE
  app.post<{ Body: CategoryCreateInput }>(
    '/categories',
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateCategory,
  );

  app.put<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    '/categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminPutCategory,
  );

  app.patch<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    '/categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchCategory,
  );

  app.delete<{ Params: { id: string } }>(
    '/categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteCategory,
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    '/categories/reorder',
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderCategories,
  );

  app.patch<{ Params: { id: string }; Body: { is_active: boolean } }>(
    '/categories/:id/active',
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleActive,
  );

  app.patch<{ Params: { id: string }; Body: { is_featured: boolean } }>(
    '/categories/:id/featured',
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleFeatured,
  );
}
