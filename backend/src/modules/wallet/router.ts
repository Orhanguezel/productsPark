// örnek: src/modules/wallet/routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  listDepositRequestsCtrl,
  createDepositRequestCtrl,
  patchDepositRequestCtrl,
  listWalletTransactionsCtrl,
  adminAdjustUserWalletCtrl,
} from "./controller";

export async function registerWallet(app: FastifyInstance) {
  const BASE = "/wallet_deposit_requests";
  const authGuard  = async (req: FastifyRequest, reply: FastifyReply) => { await requireAuth(req, reply); };
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  app.get(`${BASE}`,      { preHandler: adminGuard }, listDepositRequestsCtrl);
  app.post(`${BASE}`,      { preHandler: authGuard  }, createDepositRequestCtrl);
  app.patch(`${BASE}/:id`, { preHandler: adminGuard }, patchDepositRequestCtrl);

  app.get ("/wallet_transactions",          { preHandler: adminGuard }, listWalletTransactionsCtrl);

  app.post("/admin/users/:id/wallet/adjust",{ preHandler: adminGuard }, adminAdjustUserWalletCtrl);
}
