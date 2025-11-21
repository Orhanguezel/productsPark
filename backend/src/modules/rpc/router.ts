import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  assignStockByItems,
  assignStockByOrderId,
  type AssignItemsBody,
  type AssignOrderIdBody,
} from '@/modules/rpc/assignStock.controller';

export async function registerRpc(app: FastifyInstance) {
  app.post<{ Body: AssignItemsBody }>(
    '/rest/rpc/assign_stock_to_order',
    { preHandler: [requireAuth] },
    assignStockByItems,
  );

  app.post<{ Body: AssignOrderIdBody }>(
    '/rest/rpc/assign_stock_to_existing_order',
    { preHandler: [requireAuth] },
    assignStockByOrderId,
  );
}
