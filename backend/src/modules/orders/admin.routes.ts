// ===================================================================
// FILE: src/modules/orders/admin.routes.ts
// ===================================================================
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';

import {
  listOrdersAdmin,
  getOrderAdminById,
  listOrderItemsAdmin,
  updateOrderStatusAdmin,
  cancelOrderAdmin,
  refundOrderAdmin,
  updateOrderFulfillmentAdmin,
  listOrderTimelineAdmin,
  addOrderNoteAdmin,
} from './admin.controller';

export async function registerAdminOrders(app: FastifyInstance) {
  // Bu plugin genelde { prefix: '/admin' } ile register edilir.
  // FE RTK istekleri: /admin/orders, /admin/orders/:id, ...
  const guard = { preHandler: [requireAuth] };

  // LIST & DETAIL
  app.get('/admin/orders', guard, listOrdersAdmin);
  app.get('/admin/orders/:id', guard, getOrderAdminById);
  app.get('/admin/orders/:id/items', guard, listOrderItemsAdmin);

  // MUTATIONS
  app.patch('/admin/orders/:id/status', guard, updateOrderStatusAdmin);
  app.post('/admin/orders/:id/cancel', guard, cancelOrderAdmin);
  app.post('/admin/orders/:id/refund', guard, refundOrderAdmin);
  app.patch('/admin/orders/:id/fulfillment', guard, updateOrderFulfillmentAdmin);

  // TIMELINE
  app.get('/admin/orders/:id/timeline', guard, listOrderTimelineAdmin);
  app.post('/admin/orders/:id/timeline', guard, addOrderNoteAdmin);
}
