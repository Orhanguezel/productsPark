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

const BASE = '/categories';

export async function registerCategories(app: FastifyInstance) {
  // PUBLIC READ
  app.get(BASE, { config: { public: true } }, listCategories);
  app.get<{ Params: { id: string } }>(`${BASE}/:id`, { config: { public: true } }, getCategoryById);
  app.get<{ Params: { slug: string } }>(`${BASE}/by-slug/:slug`, { config: { public: true } }, getCategoryBySlug);

  // ADMIN WRITE
  app.post<{ Body: CategoryCreateInput }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateCategory,
  );

  app.put<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminPutCategory,
  );

  app.patch<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchCategory,
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteCategory,
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    `${BASE}/reorder`,
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderCategories,
  );

  app.patch<{ Params: { id: string }; Body: { is_active: boolean } }>(
    `${BASE}/:id/active`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleActive,
  );

  app.patch<{ Params: { id: string }; Body: { is_featured: boolean } }>(
    `${BASE}/:id/featured`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleFeatured,
  );
}
