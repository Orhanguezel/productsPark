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
  deleteOrderAdmin,               // ⬅️ EKLE
} from './admin.controller';

export async function registerAdminOrders(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth] };

  app.get('/admin/orders', guard, listOrdersAdmin);
  app.get('/admin/orders/:id', guard, getOrderAdminById);
  app.get('/admin/orders/:id/items', guard, listOrderItemsAdmin);

  app.patch('/admin/orders/:id/status', guard, updateOrderStatusAdmin);
  app.post('/admin/orders/:id/cancel', guard, cancelOrderAdmin);
  app.post('/admin/orders/:id/refund', guard, refundOrderAdmin);
  app.patch('/admin/orders/:id/fulfillment', guard, updateOrderFulfillmentAdmin);

  app.get('/admin/orders/:id/timeline', guard, listOrderTimelineAdmin);
  app.post('/admin/orders/:id/timeline', guard, addOrderNoteAdmin);

  app.delete('/admin/orders/:id', guard, deleteOrderAdmin); // ⬅️ YENİ
}
