import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listOrdersNormalized,        // GET /orders   ← RTK list
  listOrdersByUserNormalized,  // GET /orders/by-user/:userId ← RTK list by user
  getOrder,                    // GET /orders/:id ← hesap sayfası (raw + items + normalized)
  createOrder,
  updateOrder,
  updateOrderItem,
  checkoutFromCart,
} from './controller';

export async function registerOrders(app: FastifyInstance) {
  app.get('/orders', { preHandler: [requireAuth] }, listOrdersNormalized);
  app.get('/orders/by-user/:userId', { preHandler: [requireAuth] }, listOrdersByUserNormalized);
  app.get('/orders/:id', { preHandler: [requireAuth] }, getOrder);

  app.post('/orders', { preHandler: [requireAuth] }, createOrder);
  app.post('/orders/checkout', { preHandler: [requireAuth] }, checkoutFromCart);

  app.patch('/orders/:id', { preHandler: [requireAuth] }, updateOrder);
  app.patch('/order_items/:id', { preHandler: [requireAuth] }, updateOrderItem);
}
