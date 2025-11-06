import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  listDepositRequests,
  createDepositRequest,
  patchDepositRequest,
  listWalletTransactions,
  adjustUserWallet,
} from "./repository";
import {
  WdrListQuerySchema,
  WdrCreateBodySchema,
  WdrPatchBodySchema,
  WtxnListQuerySchema,
} from "./validation";
import type { WalletDepositStatus } from "./wallet.types";

const isDepositStatus = (s: unknown): s is WalletDepositStatus =>
  s === "pending" || s === "approved" || s === "rejected";

/* ===== Deposit Requests ===== */
export async function listDepositRequestsCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WdrListQuerySchema.safeParse((req as any).query);
    if (!parsed.success) return reply.code(400).send({ message: "invalid_query" });

    const { rows, total } = await listDepositRequests(parsed.data);
    reply.header("x-total-count", String(total));
    return rows;
  } catch (e) {
    req.log.error(e, "GET /wallet_deposit_requests failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function createDepositRequestCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WdrCreateBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) return reply.code(400).send({ message: "invalid_body" });

    const item = await createDepositRequest(parsed.data);
    return reply.code(201).send(item);
  } catch (e: any) {
    req.log.error(e, "POST /wallet_deposit_requests failed");
    if (e?.message === "invalid_amount") return reply.code(400).send({ message: "invalid_amount" });
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function patchDepositRequestCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: "id_required" });

    const parsed = WdrPatchBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) return reply.code(400).send({ message: "invalid_body" });

    const raw = parsed.data.status;
    const lowered = typeof raw === "string" ? raw.toLowerCase() : raw;
    const status: WalletDepositStatus | undefined = isDepositStatus(lowered) ? lowered : undefined;

    const repoPatch = {
      status,
      admin_notes: parsed.data.admin_notes ?? undefined,
      payment_proof: parsed.data.payment_proof ?? undefined,
      processed_at:
        typeof parsed.data.processed_at === "string"
          ? parsed.data.processed_at
          : parsed.data.processed_at === null
            ? null
            : undefined,
    };

    const item = await patchDepositRequest(id, repoPatch);
    if (!item) return reply.code(404).send({ message: "not_found" });
    return item;
  } catch (e) {
    req.log.error(e, "PATCH /wallet_deposit_requests/:id failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

/* ===== Wallet Transactions ===== */
export async function listWalletTransactionsCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WtxnListQuerySchema.safeParse((req as any).query);
    if (!parsed.success) return reply.code(400).send({ message: "invalid_query" });

    const { rows, total } = await listWalletTransactions(parsed.data);
    reply.header("x-total-count", String(total));
    return rows;
  } catch (e) {
    req.log.error(e, "GET /wallet_transactions failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

/* ===== Admin: Adjust Wallet (atomik) ===== */
const AdjustBodySchema = z.object({
  amount: z.number().finite().refine((v) => v !== 0, "invalid_amount"),
  description: z.string().trim().max(500).optional(),
});

export async function adminAdjustUserWalletCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: "id_required" });

    const parsed = AdjustBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) return reply.code(400).send({ message: "invalid_body" });

    const { amount, description } = parsed.data;
    const { balance, transaction } = await adjustUserWallet(id, amount, description);

    return reply.send({ ok: true, balance, transaction });
  } catch (e: any) {
    if (e?.message === "user_not_found") return reply.code(404).send({ message: "user_not_found" });
    if (e?.message === "invalid_amount") return reply.code(400).send({ message: "invalid_amount" });
    req.log.error({ err: e }, "POST /admin/users/:id/wallet/adjust failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}
