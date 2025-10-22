import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderItem,
  checkoutFromCart,
} from './controller';

export async function registerOrders(app: FastifyInstance) {
  app.get('/orders', { preHandler: [requireAuth] }, listMyOrders);
  app.get('/orders/:id', { preHandler: [requireAuth] }, getOrder);
  app.post('/orders', { preHandler: [requireAuth] }, createOrder);
  app.post('/orders/checkout', { preHandler: [requireAuth] }, checkoutFromCart);
  app.patch('/orders/:id', { preHandler: [requireAuth] }, updateOrder);
  app.patch('/order_items/:id', { preHandler: [requireAuth] }, updateOrderItem);
}
