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

const BASE = "/orders";

export async function registerOrders(app: FastifyInstance) {
  app.get(`${BASE}`, { preHandler: [requireAuth] }, listOrdersNormalized);
  app.get(`${BASE}/by-user/:userId`, { preHandler: [requireAuth] }, listOrdersByUserNormalized);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getOrder);

  app.post(`${BASE}`, { preHandler: [requireAuth] }, createOrder);
  app.post(`${BASE}/checkout`, { preHandler: [requireAuth] }, checkoutFromCart);

  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateOrder);
  app.patch('/order_items/:id', { preHandler: [requireAuth] }, updateOrderItem);
}
