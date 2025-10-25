import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listProducts,
  getProductByIdOrSlug, // ✅ yeni ortak handler
  getProductById,       // (opsiyonel, admin/backoffice için)
  getProductBySlug,     // (opsiyonel, backward-compat)
  createProduct,
  updateProduct,
  deleteProduct,
  listProductFaqs,
  createProductFaq,
  updateProductFaq,
  deleteProductFaq,
  listProductOptions,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  listProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  listProductStock,
  createProductStock,
  updateProductStock,
  deleteProductStock,
} from './controller';

export async function registerProducts(app: FastifyInstance) {
  // Liste
  app.get('/products', { config: { public: true } }, listProducts);

  // ✅ Tek rota: id veya slug
  app.get('/products/:idOrSlug', { config: { public: true } }, getProductByIdOrSlug);

  // (Opsiyonel) Eski rotaları açık tutmak istersen:
  app.get('/products/by-slug/:slug', { config: { public: true } }, getProductBySlug);
  app.get('/products/id/:id', { config: { public: true } }, getProductById);

  // CRUD
  app.post('/products', { preHandler: [requireAuth] }, createProduct);
  app.patch('/products/:id', { preHandler: [requireAuth] }, updateProduct);
  app.delete('/products/:id', { preHandler: [requireAuth] }, deleteProduct);

  // FAQ
  app.get('/product_faqs', { config: { public: true } }, listProductFaqs);
  app.post('/product_faqs', { preHandler: [requireAuth] }, createProductFaq);
  app.patch('/product_faqs/:id', { preHandler: [requireAuth] }, updateProductFaq);
  app.delete('/product_faqs/:id', { preHandler: [requireAuth] }, deleteProductFaq);

  // Options
  app.get('/product_options', { config: { public: true } }, listProductOptions);
  app.post('/product_options', { preHandler: [requireAuth] }, createProductOption);
  app.patch('/product_options/:id', { preHandler: [requireAuth] }, updateProductOption);
  app.delete('/product_options/:id', { preHandler: [requireAuth] }, deleteProductOption);

  // Reviews
  app.get('/product_reviews', { config: { public: true } }, listProductReviews);
  app.post('/product_reviews', { config: { public: true } }, createProductReview);
  app.patch('/product_reviews/:id', { preHandler: [requireAuth] }, updateProductReview);
  app.delete('/product_reviews/:id', { preHandler: [requireAuth] }, deleteProductReview);

  // Stock
  app.get('/product_stock', { preHandler: [requireAuth] }, listProductStock);
  app.post('/product_stock', { preHandler: [requireAuth] }, createProductStock);
  app.patch('/product_stock/:id', { preHandler: [requireAuth] }, updateProductStock);
  app.delete('/product_stock/:id', { preHandler: [requireAuth] }, deleteProductStock);
}
