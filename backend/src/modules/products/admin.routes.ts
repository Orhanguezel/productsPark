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
  // ❌ adminListApiProviders kaldırıldı (kendi modülünde)
} from './admin.controller';

export async function registerProductsAdmin(app: FastifyInstance) {
  // Products
  app.get('/admin/products', { preHandler: [requireAuth] }, adminListProducts);
  app.get('/admin/products/:id', { preHandler: [requireAuth] }, adminGetProduct);
  app.post('/admin/products', { preHandler: [requireAuth] }, adminCreateProduct);
  app.patch('/admin/products/:id', { preHandler: [requireAuth] }, adminUpdateProduct);
  app.delete('/admin/products/:id', { preHandler: [requireAuth] }, adminDeleteProduct);

  // Bulk ops
  app.post('/admin/products/bulk/active', { preHandler: [requireAuth] }, adminBulkSetActive);
  app.post('/admin/products/bulk/reorder', { preHandler: [requireAuth] }, adminReorderProducts);

  // Toggles
  app.patch('/admin/products/:id/active', { preHandler: [requireAuth] }, adminToggleActive);
  app.patch('/admin/products/:id/homepage', { preHandler: [requireAuth] }, adminToggleHomepage);

  // Relations: reviews & faqs (replace modeli)
  app.put('/admin/products/:id/reviews', { preHandler: [requireAuth] }, adminReplaceReviews);
  app.put('/admin/products/:id/faqs', { preHandler: [requireAuth] }, adminReplaceFaqs);

  // Stock
  app.put('/admin/products/:id/stock', { preHandler: [requireAuth] }, adminSetProductStock);
  app.get('/admin/products/:id/stock/used', { preHandler: [requireAuth] }, adminListUsedStock);

  // Lists used by FE (filters)
  app.get('/admin/categories', { preHandler: [requireAuth] }, adminListCategories);
}
