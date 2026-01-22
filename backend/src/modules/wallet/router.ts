// =============================================================
// FILE: src/modules/wallet/router.ts
// FINAL — Wallet module routes (public only here), hot-reload safe
// Registered once from app.ts with prefix "/api"
// Paths: /api/wallet/*
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';

import {
  createDepositRequestCtrl,
  meWalletBalanceCtrl,
  meWalletTransactionsCtrl,
} from './controller';

const BASE = '/wallet';

export async function registerWallet(app: FastifyInstance) {


  const guards = { preHandler: [requireAuth] as any };

  // Public (auth required)
  app.post(`${BASE}/deposit_requests`, guards, createDepositRequestCtrl);
  app.get(`${BASE}/me/balance`, guards, meWalletBalanceCtrl);
  app.get(`${BASE}/me/transactions`, guards, meWalletTransactionsCtrl);
}
