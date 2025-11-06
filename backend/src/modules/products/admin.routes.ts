// =============================================================
// FILE: src/modules/products/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminBulkSetActive,
  adminReorderProducts,
  adminToggleActive,
  adminToggleHomepage,
  adminReplaceReviews,
  adminReplaceFaqs,
  adminSetProductStock,
  adminListUsedStock,
  adminListCategories,
} from './admin.controller';

const BASE = '/admin/products';

export async function registerProductsAdmin(app: FastifyInstance) {
  // Products
  app.get(`${BASE}`, { preHandler: [requireAuth] }, adminListProducts);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, adminGetProduct);
  app.post(`${BASE}`, { preHandler: [requireAuth] }, adminCreateProduct);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, adminUpdateProduct);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, adminDeleteProduct);

  // Bulk ops
  app.post(`${BASE}/bulk/active`, { preHandler: [requireAuth] }, adminBulkSetActive);
  app.post(`${BASE}/bulk/reorder`, { preHandler: [requireAuth] }, adminReorderProducts);

  // Toggles
  app.patch(`${BASE}/:id/active`, { preHandler: [requireAuth] }, adminToggleActive);
  app.patch(`${BASE}/:id/homepage`, { preHandler: [requireAuth] }, adminToggleHomepage);

  // Relations: reviews & faqs (replace modeli)
  app.put(`${BASE}/:id/reviews`, { preHandler: [requireAuth] }, adminReplaceReviews);
  app.put(`${BASE}/:id/faqs`, { preHandler: [requireAuth] }, adminReplaceFaqs);

  // Stock
  app.put(`${BASE}/:id/stock`, { preHandler: [requireAuth] }, adminSetProductStock);
  app.get(`${BASE}/:id/stock/used`, { preHandler: [requireAuth] }, adminListUsedStock);

  // Lists used by FE (filters)
  app.get('/admin/categories', { preHandler: [requireAuth] }, adminListCategories);
}
