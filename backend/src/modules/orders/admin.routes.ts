// ===================================================================
// FILE: src/modules/orders/admin.routes.ts
// ===================================================================
import type { FastifyInstance } from "fastify";
import { requireAuth, requireAdmin } from "@/common/middleware/auth";

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
  deleteOrderAdmin,
} from "./admin.controller";

const BASE = "/admin/orders";

export async function registerAdminOrders(app: FastifyInstance) {
  // Sadece admin kullanıcılar erişebilsin
  const guard = { preHandler: [requireAuth, requireAdmin] };

  app.get(`${BASE}`, guard, listOrdersAdmin);
  app.get(`${BASE}/:id`, guard, getOrderAdminById);
  app.get(`${BASE}/:id/items`, guard, listOrderItemsAdmin);

  app.patch(`${BASE}/:id/status`, guard, updateOrderStatusAdmin);
  app.post(`${BASE}/:id/cancel`, guard, cancelOrderAdmin);
  app.post(`${BASE}/:id/refund`, guard, refundOrderAdmin);
  app.patch(`${BASE}/:id/fulfillment`, guard, updateOrderFulfillmentAdmin);

  app.get(`${BASE}/:id/timeline`, guard, listOrderTimelineAdmin);
  app.post(`${BASE}/:id/timeline`, guard, addOrderNoteAdmin);

  app.delete(`${BASE}/:id`, guard, deleteOrderAdmin);
}

