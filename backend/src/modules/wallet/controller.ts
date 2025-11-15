// src/modules/wallet/controller.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";

import {
  listDepositRequests,
  createDepositRequest,
  patchDepositRequest,
  listWalletTransactions,
  adjustUserWallet,
  getUserWalletBalance,
} from "./repository";
import {
  WdrListQuerySchema,
  WdrCreateBodySchema,
  WdrPatchBodySchema,
  WtxnListQuerySchema,
} from "./validation";
import type { WalletDepositStatus } from "./wallet.types";

import { db } from "@/db/client";
import { users } from "@/modules/auth/schema";
import { email_templates } from "@/modules/email-templates/schema";
import { renderTextWithParams } from "@/modules/email-templates/utils";
import { sendMailRaw } from "@/modules/mail/service";

/* ===== common helper: user id ===== */
type JwtUser = { sub?: unknown; id?: unknown };

const getUserIdFromReq = (req: FastifyRequest): string => {
  const payload = (req as any).user as JwtUser | undefined;
  const sub = payload?.sub;
  const id = payload?.id;

  const value =
    (typeof id === "string" && id) ||
    (typeof sub === "string" && sub) ||
    "";

  if (!value) {
    throw new Error("unauthorized");
  }
  return value;
};

const isDepositStatus = (s: unknown): s is WalletDepositStatus =>
  s === "pending" || s === "approved" || s === "rejected";

/* ===== locale helper (email templates için) ===== */
const getLocaleFromReq = (req: FastifyRequest): string | undefined => {
  const header =
    (req.headers["x-locale"] as string | undefined) ||
    (req.headers["accept-language"] as string | undefined);

  if (!header) return undefined;
  const first = header.split(",")[0]?.trim();
  if (!first) return undefined;
  return first.slice(0, 10); // email_templates.locale max 10 char
};

/* ===== site_name helper (site_settings tablosundan) ===== */
async function getSiteNameForEmails(): Promise<string> {
  // footer_company_name > site_title fallback
  try {
    const rows: any[] = await db.execute(
      sql`
        SELECT value
        FROM site_settings
        WHERE \`key\` IN ('footer_company_name', 'site_title')
        ORDER BY FIELD(\`key\`, 'footer_company_name', 'site_title')
        LIMIT 1
      `,
    );

    const v = rows?.[0]?.value;
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  } catch (err) {
    // log etmiyoruz, email sırasında fallback kullanacağız
  }
  return "Dijital Market";
}

/* ===== email template render helper (deposit_success) ===== */
async function renderEmailTemplateByKey(
  key: string,
  params: Record<string, unknown>,
  locale?: string,
): Promise<{ subject: string; html: string }> {
  let row:
    | (typeof email_templates.$inferSelect)
    | undefined;

  if (locale) {
    const [exact] = await db
      .select()
      .from(email_templates)
      .where(
        and(
          eq(email_templates.template_key, key),
          eq(email_templates.is_active, 1),
          eq(email_templates.locale, locale),
        ),
      )
      .limit(1);
    row = exact;
  }

  if (!row) {
    const [fallback] = await db
      .select()
      .from(email_templates)
      .where(
        and(
          eq(email_templates.template_key, key),
          eq(email_templates.is_active, 1),
          isNull(email_templates.locale),
        ),
      )
      .limit(1);
    row = fallback;
  }

  if (!row) {
    throw new Error(`email_template_not_found:${key}`);
  }

  const subject = renderTextWithParams(row.subject, params);
  const html = renderTextWithParams(row.content, params);

  return { subject, html };
}

/* ===== Deposit Success Mail helper ===== */
async function sendDepositSuccessEmail(args: {
  req: FastifyRequest;
  deposit: {
    user_id: string;
    amount: number;
  };
}) {
  const { req, deposit } = args;

  // Kullanıcı email'ini al
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, deposit.user_id))
    .limit(1);

  if (!u || !u.email) return; // email yoksa sessiz geç

  const locale = getLocaleFromReq(req);
  const siteName = await getSiteNameForEmails();
  const newBalance = await getUserWalletBalance(deposit.user_id);

  const userEmail = u.email;
  const userName =
    typeof userEmail === "string" && userEmail.includes("@")
      ? userEmail.split("@")[0]
      : userEmail;

  const { subject, html } = await renderEmailTemplateByKey(
    "deposit_success",
    {
      user_name: userName,
      amount: deposit.amount.toFixed(2),
      new_balance: newBalance.toFixed(2),
      site_name: siteName,
    },
    locale,
  );

  await sendMailRaw({
    to: u.email,
    subject,
    html,
    text: undefined, // sadece HTML template yeterli
  });
}

/* ===== Deposit Requests ===== */
export async function listDepositRequestsCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const parsed = WdrListQuerySchema.safeParse((req as any).query);
    if (!parsed.success)
      return reply.code(400).send({ message: "invalid_query" });

    const { rows, total } = await listDepositRequests(parsed.data);
    reply.header("x-total-count", String(total));
    return rows;
  } catch (e) {
    req.log.error(e, "GET /wallet_deposit_requests failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function createDepositRequestCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const parsed = WdrCreateBodySchema.safeParse(
      ((req as any).body ?? {}) as unknown,
    );
    if (!parsed.success)
      return reply.code(400).send({ message: "invalid_body" });

    // ✅ user_id HER ZAMAN JWT’den
    const userId = getUserIdFromReq(req);

    const item = await createDepositRequest({
      user_id: userId,
      amount: parsed.data.amount,
      payment_method: parsed.data.payment_method,
      payment_proof: parsed.data.payment_proof ?? null,
    });

    return reply.code(201).send(item);
  } catch (e: any) {
    req.log.error(e, "POST /wallet_deposit_requests failed");
    if (e?.message === "invalid_amount") {
      return reply.code(400).send({ message: "invalid_amount" });
    }
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ message: "unauthorized" });
    }
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

export async function patchDepositRequestCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: "id_required" });

    const parsed = WdrPatchBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success)
      return reply.code(400).send({ message: "invalid_body" });

    const raw = parsed.data.status;
    const lowered = typeof raw === "string" ? raw.toLowerCase() : raw;
    const status: WalletDepositStatus | undefined = isDepositStatus(lowered)
      ? lowered
      : undefined;

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

    // ✅ Onaylandı ise deposit_success maili gönder
    if (item.status === "approved") {
      try {
        await sendDepositSuccessEmail({
          req,
          deposit: {
            user_id: item.user_id,
            amount: item.amount,
          },
        });
      } catch (err) {
        req.log.error(
          { err, id },
          "deposit_success_email_failed",
        );
        // mail hatası response'u bozmasın
      }
    }

    return item;
  } catch (e) {
    req.log.error(e, "PATCH /wallet_deposit_requests/:id failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

/* ===== Wallet Transactions (admin) ===== */
export async function listWalletTransactionsCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const parsed = WtxnListQuerySchema.safeParse((req as any).query);
    if (!parsed.success)
      return reply.code(400).send({ message: "invalid_query" });

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

export async function adminAdjustUserWalletCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: "id_required" });

    const parsed = AdjustBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success)
      return reply.code(400).send({ message: "invalid_body" });

    const { amount, description } = parsed.data;
    const { balance, transaction } = await adjustUserWallet(
      id,
      amount,
      description,
    );

    return reply.send({ ok: true, balance, transaction });
  } catch (e: any) {
    if (e?.message === "user_not_found") {
      return reply.code(404).send({ message: "user_not_found" });
    }
    if (e?.message === "invalid_amount") {
      return reply.code(400).send({ message: "invalid_amount" });
    }
    req.log.error(
      { err: e },
      "POST /admin/users/:id/wallet/adjust failed",
    );
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

/* ===== Me: Wallet Balance ===== */
export async function meWalletBalanceCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const userId = getUserIdFromReq(req);
    const balance = await getUserWalletBalance(userId);
    return reply.send({ balance });
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ message: "unauthorized" });
    }
    req.log.error(e, "GET /me/wallet_balance failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}

/* ===== Me: Wallet Transactions ===== */
export async function meWalletTransactionsCtrl(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const userId = getUserIdFromReq(req);

    const parsed = WtxnListQuerySchema.safeParse((req as any).query);
    const safe = parsed.success ? parsed.data : {};

    const { rows, total } = await listWalletTransactions({
      user_id: userId,
      limit: typeof safe.limit === "number" ? safe.limit : 100,
      offset: typeof safe.offset === "number" ? safe.offset : 0,
      order:
        typeof safe.order === "string"
          ? safe.order
          : "created_at.desc",
      // type istersen burada da forward edebilirsin:
      // type: safe.type,
    });

    reply.header("x-total-count", String(total));
    return rows;
  } catch (e: any) {
    if (e?.message === "unauthorized") {
      return reply.code(401).send({ message: "unauthorized" });
    }
    req.log.error(e, "GET /me/wallet_transactions failed");
    return reply.code(500).send({ message: "request_failed_500" });
  }
}
