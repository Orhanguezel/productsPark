import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listProducts,
  getProductById,
  getProductBySlug,
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
  // products
  app.get('/products', listProducts);
  app.get('/products/:id', getProductById);
  app.get('/products/by-slug/:slug', getProductBySlug); // FE slug ile detail
  app.post('/products', { preHandler: [requireAuth] }, createProduct);
  app.patch('/products/:id', { preHandler: [requireAuth] }, updateProduct);
  app.delete('/products/:id', { preHandler: [requireAuth] }, deleteProduct);

  // product_faqs
  app.get('/product_faqs', listProductFaqs);
  app.post('/product_faqs', { preHandler: [requireAuth] }, createProductFaq);
  app.patch('/product_faqs/:id', { preHandler: [requireAuth] }, updateProductFaq);
  app.delete('/product_faqs/:id', { preHandler: [requireAuth] }, deleteProductFaq);

  // product_options
  app.get('/product_options', listProductOptions);
  app.post('/product_options', { preHandler: [requireAuth] }, createProductOption);
  app.patch('/product_options/:id', { preHandler: [requireAuth] }, updateProductOption);
  app.delete('/product_options/:id', { preHandler: [requireAuth] }, deleteProductOption);

  // product_reviews
  app.get('/product_reviews', listProductReviews);
  app.post('/product_reviews', createProductReview); // public bırakıldı (istersen requireAuth ekleyebilirsin)
  app.patch('/product_reviews/:id', { preHandler: [requireAuth] }, updateProductReview);
  app.delete('/product_reviews/:id', { preHandler: [requireAuth] }, deleteProductReview);

  // product_stock
  app.get('/product_stock', { preHandler: [requireAuth] }, listProductStock);
  app.post('/product_stock', { preHandler: [requireAuth] }, createProductStock);
  app.patch('/product_stock/:id', { preHandler: [requireAuth] }, updateProductStock);
  app.delete('/product_stock/:id', { preHandler: [requireAuth] }, deleteProductStock);
}
