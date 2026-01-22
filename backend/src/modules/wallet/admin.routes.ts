// =============================================================
// FILE: src/modules/wallet/admin.routes.ts
// FINAL — Admin routes only
// Mounted by wallet/router.ts under: /wallet/admin
// So final paths (with app prefix /api): /api/wallet/admin/*
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

import {
  listDepositRequestsCtrl,
  patchDepositRequestCtrl,
  listWalletTransactionsCtrl,
  adminAdjustUserWalletCtrl,
} from './admin.controller';

const ADMIN_BASE = '/wallet';

export async function registerWalletAdmin(app: FastifyInstance) {
  const adminGuards = { preHandler: [requireAuth, requireAdmin] as any };

  app.get(`${ADMIN_BASE}/deposit_requests`, adminGuards, listDepositRequestsCtrl);
  app.patch(`${ADMIN_BASE}/deposit_requests/:id`, adminGuards, patchDepositRequestCtrl);

  app.get(`${ADMIN_BASE}/transactions`, adminGuards, listWalletTransactionsCtrl);
  app.post(`${ADMIN_BASE}/users/:id/adjust`, adminGuards, adminAdjustUserWalletCtrl);
}
