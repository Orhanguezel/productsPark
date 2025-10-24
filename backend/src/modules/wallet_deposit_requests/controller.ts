import type { FastifyRequest, FastifyReply } from "fastify";
import { listDepositRequests, createDepositRequest, patchDepositRequest } from "./repository";

type Qs = {
  select?: string;
  user_id?: string;
  status?: "pending" | "approved" | "rejected";
  order?: string;
  limit?: string | number;
  offset?: string | number;
};

type CreateBody = {
  user_id: string;
  amount: number | string;
  payment_method?: string;
  payment_proof?: string | null;
};

type PatchBody = {
  status?: "pending" | "approved" | "rejected";
  admin_notes?: string | null;
};

export async function listDepositRequestsCtrl(
  req: FastifyRequest<{ Querystring: Qs }>,
  reply: FastifyReply
) {
  try {
    const q = req.query ?? {};
    const { rows, total } = await listDepositRequests({
      select: q.select,
      user_id: q.user_id,
      status: q.status,
      order: q.order,
      limit: q.limit != null ? Number(q.limit) : undefined,
      offset: q.offset != null ? Number(q.offset) : undefined,
    });
    reply.header("x-total-count", String(total));
    return rows;
  } catch (e) {
    req.log.error(e, "get /wallet_deposit_requests failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function createDepositRequestCtrl(
  req: FastifyRequest<{ Body: CreateBody }>,
  reply: FastifyReply
) {
  try {
    const body = req.body ?? ({} as CreateBody);
    if (!body?.user_id) return reply.code(400).send({ message: "user_id_required" });
    const rows = await createDepositRequest(body);
    return reply.code(201).send(rows); // tek elemanlı dizi
  } catch (e: any) {
    req.log.error(e, "post /wallet_deposit_requests failed");
    if (e?.message === "invalid_amount") return reply.code(400).send({ message: "invalid_amount" });
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function patchDepositRequestCtrl(
  req: FastifyRequest<{ Params: { id: string }; Body: PatchBody }>,
  reply: FastifyReply
) {
  try {
    const id = req.params.id;
    const rows = await patchDepositRequest(id, req.body ?? {});
    if (!rows) return reply.code(404).send({ message: "not_found" });
    return rows;
  } catch (e) {
    req.log.error(e, "patch /wallet_deposit_requests/:id failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}
