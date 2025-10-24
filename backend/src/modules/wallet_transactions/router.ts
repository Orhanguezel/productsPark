import type { FastifyInstance } from "fastify";
import { listWalletTransactionsCtrl } from "./controller";

export async function registerWalletTransactions(app: FastifyInstance) {
  app.get("/wallet_transactions", { config: { public: true } }, listWalletTransactionsCtrl);
}
