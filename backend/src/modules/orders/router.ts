import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listOrdersNormalized,
  listOrdersByUserNormalized,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderItem,
  checkoutFromCart,
} from './controller';

const BASE = '/orders';

export async function registerOrders(app: FastifyInstance) {
  app.get(`${BASE}`, { preHandler: [requireAuth] }, listOrdersNormalized);
  app.get(`${BASE}/by-user/:userId`, { preHandler: [requireAuth] }, listOrdersByUserNormalized);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getOrder);

  app.post(`${BASE}`, { preHandler: [requireAuth] }, createOrder);
  app.post(`${BASE}/checkout`, { preHandler: [requireAuth] }, checkoutFromCart);

  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateOrder);

  // ✅ preferred (scoped)
  app.patch(`${BASE}/order_items/:id`, { preHandler: [requireAuth] }, updateOrderItem);

  // ✅ backward compatible (if FE still calls this)
  app.patch(`/order_items/:id`, { preHandler: [requireAuth] }, updateOrderItem);
}
