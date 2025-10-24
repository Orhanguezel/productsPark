import type { FastifyRequest, FastifyReply } from "fastify";
import { listWalletTransactions } from "./repository";

type Qs = {
  select?: string;
  user_id?: string;
  type?: "deposit" | "withdrawal" | "purchase" | "refund";
  order?: string;
  limit?: string | number;
  offset?: string | number;
};

export async function listWalletTransactionsCtrl(
  req: FastifyRequest<{ Querystring: Qs }>,
  reply: FastifyReply
) {
  try {
    const q = req.query ?? {};
    const { rows, total } = await listWalletTransactions({
      select: q.select,
      user_id: q.user_id,
      type: q.type,
      order: q.order,
      limit: q.limit != null ? Number(q.limit) : undefined,
      offset: q.offset != null ? Number(q.offset) : undefined,
    });
    reply.header("x-total-count", String(total));
    return rows;
  } catch (e) {
    req.log.error(e, "get /wallet_transactions failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}
