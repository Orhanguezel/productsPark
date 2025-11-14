// =============================================================
// FILE: src/modules/products/routes.ts
// (Public routes)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listProducts,
  getProductByIdOrSlug,
  getProductById,
  getProductBySlug,
  // FAQ
  listProductFaqs,
  // Options
  listProductOptions,
  // Reviews
  listProductReviews,
  createProductReview,
  // Stock
  listProductStock,
} from "./controller";

const BASE = "/products";

export async function registerProducts(app: FastifyInstance) {
  // Core products
  app.get(BASE, listProducts);
  app.get(`${BASE}/:idOrSlug`, getProductByIdOrSlug);
  app.get(`${BASE}/id/:id`, getProductById);
  app.get(`${BASE}/by-slug/:slug`, getProductBySlug);
  app.get(`${BASE}/faqs`, listProductFaqs);
  app.get(`${BASE}/options`, listProductOptions);
  app.get(`${BASE}/reviews`, listProductReviews);
  app.post(`${BASE}/reviews`, createProductReview);
  app.get(`${BASE}/stock`, listProductStock);

}
