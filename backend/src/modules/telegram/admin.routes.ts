// ===================================================================
// FILE: src/modules/telegram/admin.routes.ts
// FINAL — Telegram admin routes (single source of truth)
// - GET  /admin/telegram/inbound
// - GET  /admin/telegram/autoreply
// - POST /admin/telegram/autoreply
// - POST /admin/telegram/test
// - POST /admin/telegram/send
// - POST /admin/telegram/event
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';

import {
  listTelegramInboundCtrl,
  getTelegramAutoReplyCtrl,
  updateTelegramAutoReplyCtrl,
} from './admin.controller';

const ADMIN_BASE = '/telegram';

export async function registerTelegramAdminRoutes(app: FastifyInstance) {
  const guards = { preHandler: [requireAuth] };

  // inbound list
  app.get(`${ADMIN_BASE}/inbound`, guards, listTelegramInboundCtrl);

  // autoreply
  app.get(`${ADMIN_BASE}/autoreply`, guards, getTelegramAutoReplyCtrl);
  app.post(`${ADMIN_BASE}/autoreply`, guards, updateTelegramAutoReplyCtrl);

}
