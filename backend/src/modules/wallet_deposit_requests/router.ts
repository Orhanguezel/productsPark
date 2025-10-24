import type { FastifyInstance } from "fastify";
import {
  listDepositRequestsCtrl,
  createDepositRequestCtrl,
  patchDepositRequestCtrl,
} from "./controller";

export async function registerWalletDeposits(app: FastifyInstance) {
  app.get("/wallet_deposit_requests", { config: { public: true } }, listDepositRequestsCtrl);
  app.post("/wallet_deposit_requests", createDepositRequestCtrl);
  app.patch("/wallet_deposit_requests/:id", patchDepositRequestCtrl);
}
