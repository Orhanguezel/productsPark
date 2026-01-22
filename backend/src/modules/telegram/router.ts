// ===================================================================
// FILE: src/modules/telegram/admin.router.ts
// Admin-only Telegram routes
// - /admin/telegram/test
// - /admin/telegram/send
// - /admin/telegram/event
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { telegramTestCtrl, telegramSendCtrl, telegramEventCtrl } from './controller';

const BASE = '/telegram';

export async function registerTelegramAdmin(app: FastifyInstance) {
  const guards = { preHandler: [requireAuth] };

  // test (admin)
  app.post(`${BASE}/test`, guards, telegramTestCtrl);

  // generic send (admin)
  app.post(`${BASE}/send`, guards, telegramSendCtrl);

  // template-based event send (admin)
  app.post(`${BASE}/event`, guards, telegramEventCtrl);
}
