import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listMyCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearMyCart,
} from './controller';

export async function registerCart(app: FastifyInstance) {
  app.get('/cart_items', { preHandler: [requireAuth] }, listMyCart);
  app.post('/cart_items', { preHandler: [requireAuth] }, addToCart);
  app.patch('/cart_items/:id', { preHandler: [requireAuth] }, updateCartItem);
  app.delete('/cart_items/:id', { preHandler: [requireAuth] }, deleteCartItem);
  app.delete('/cart_items', { preHandler: [requireAuth] }, clearMyCart);
}
