// =============================================================
// FILE: src/modules/wallet/admin.controller.ts
// FINAL — Admin Wallet Controller
// - Patch deposit: uses repository { item, justApproved }
// - Email/Telegram only on first approval
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';

import {
  listDepositRequests,
  patchDepositRequest,
  listWalletTransactions,
  adjustUserWallet,
  getUserWalletBalance,
} from './repository';

import { WdrListQuerySchema, WdrPatchBodySchema, WtxnListQuerySchema } from './validation';
import type { WalletDepositStatus } from './wallet.types';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { sendTemplatedEmail } from '@/modules/email-templates/mailer';
import { sendTelegramEvent } from '@/modules/telegram/service';

/* ---------------- helpers ---------------- */

const isDepositStatus = (s: unknown): s is WalletDepositStatus =>
  s === 'pending' || s === 'approved' || s === 'rejected';

function parseMysqlDateTimeSafe(input: string | null | undefined): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  const isoLike = s.includes('T') ? s : s.replace(' ', 'T');
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toUserLabelFromEmail(email: string): string {
  const e = String(email || '').trim();
  if (!e) return '';
  return e.includes('@') ? e.split('@')[0] : e;
}

async function getSiteName(): Promise<string> {
  try {
    const rows: any[] = await db.execute(sql`
      SELECT value
      FROM site_settings
      WHERE \`key\` IN ('footer_company_name', 'site_title')
      ORDER BY FIELD(\`key\`, 'footer_company_name', 'site_title')
      LIMIT 1
    `);

    const raw = rows?.[0]?.value;
    const s = raw == null ? '' : String(raw).trim();
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
      } catch {
        // ignore
      }
      return s;
    }
  } catch {
    // ignore
  }
  return 'Dijital Market';
}

async function getUserLabel(userId: string): Promise<string> {
  try {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (u?.email) return toUserLabelFromEmail(u.email);
  } catch {
    // ignore
  }
  return userId;
}

/* ---------------- email + telegram on approve ---------------- */

async function sendDepositSuccessEmail(args: {
  req: FastifyRequest;
  deposit: { user_id: string; amount: number };
}) {
  const { req, deposit } = args;

  const [u] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, deposit.user_id))
    .limit(1);
  if (!u?.email) return;

  const locale =
    (req.headers['x-locale'] as string | undefined) ||
    (req.headers['accept-language'] as string | undefined)?.split(',')[0]?.trim();

  const siteName = await getSiteName();
  const newBalance = await getUserWalletBalance(deposit.user_id);
  const userName = toUserLabelFromEmail(u.email);

  await sendTemplatedEmail({
    to: u.email,
    key: 'deposit_success',
    locale: locale ? locale.slice(0, 10) : null,
    params: {
      user_name: userName,
      amount: deposit.amount.toFixed(2),
      new_balance: newBalance.toFixed(2),
      site_name: siteName,
    },
  });
}

async function notifyDepositApprovedTelegram(args: {
  deposit: { user_id: string; amount: number; processed_at?: string | Date | null };
}) {
  const siteName = await getSiteName();
  const dt =
    args.deposit.processed_at instanceof Date
      ? args.deposit.processed_at
      : typeof args.deposit.processed_at === 'string'
        ? (parseMysqlDateTimeSafe(args.deposit.processed_at) ?? new Date())
        : new Date();

  await sendTelegramEvent({
    event: 'deposit_approved',
    data: {
      site_name: siteName,
      user_name: await getUserLabel(args.deposit.user_id),
      amount: args.deposit.amount.toFixed(2),
      created_at: dt.toLocaleString('tr-TR'),
    },
  });
}

/* ---------------- controllers (admin) ---------------- */

export async function listDepositRequestsCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WdrListQuerySchema.safeParse((req as any).query);
    if (!parsed.success) return reply.code(400).send({ message: 'invalid_query' });

    const { rows, total } = await listDepositRequests(parsed.data);
    reply.header('x-total-count', String(total));
    return rows;
  } catch (e) {
    req.log.error(e, 'GET /wallet/admin/deposit_requests failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}

export async function patchDepositRequestCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: 'id_required' });

    const parsed = WdrPatchBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) return reply.code(400).send({ message: 'invalid_body' });

    const raw = parsed.data.status;
    const lowered = typeof raw === 'string' ? raw.toLowerCase() : raw;
    const status: WalletDepositStatus | undefined = isDepositStatus(lowered) ? lowered : undefined;

    const res = await patchDepositRequest(id, {
      status,
      admin_notes: parsed.data.admin_notes ?? undefined,
      payment_proof: parsed.data.payment_proof ?? undefined,
      processed_at:
        typeof parsed.data.processed_at === 'string'
          ? parsed.data.processed_at
          : parsed.data.processed_at === null
            ? null
            : undefined,
    });

    if (!res) return reply.code(404).send({ message: 'not_found' });

    const { item, justApproved } = res;

    // ✅ only on first approval
    if (justApproved) {
      try {
        await sendDepositSuccessEmail({
          req,
          deposit: { user_id: item.user_id, amount: Number(item.amount) },
        });
      } catch (err) {
        req.log.error({ err, id }, 'deposit_success_email_failed');
      }

      try {
        await notifyDepositApprovedTelegram({
          deposit: {
            user_id: item.user_id,
            amount: Number(item.amount),
            processed_at: (item as any).processed_at ?? null,
          },
        });
      } catch (err) {
        req.log.error(err, 'deposit_approved_telegram_failed');
      }
    }

    return item;
  } catch (e) {
    req.log.error(e, 'PATCH /wallet/admin/deposit_requests/:id failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}

export async function listWalletTransactionsCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WtxnListQuerySchema.safeParse((req as any).query);
    if (!parsed.success) return reply.code(400).send({ message: 'invalid_query' });

    const { rows, total } = await listWalletTransactions(parsed.data);
    reply.header('x-total-count', String(total));
    return rows;
  } catch (e) {
    req.log.error(e, 'GET /wallet/admin/transactions failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}

const AdjustBodySchema = z.object({
  amount: z
    .number()
    .finite()
    .refine((v) => v !== 0, 'invalid_amount'),
  description: z.string().trim().max(500).optional(),
});

export async function adminAdjustUserWalletCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const id = (req as any)?.params?.id as string | undefined;
    if (!id) return reply.code(400).send({ message: 'id_required' });

    const parsed = AdjustBodySchema.safeParse((req as any).body ?? {});
    if (!parsed.success) return reply.code(400).send({ message: 'invalid_body' });

    const { amount, description } = parsed.data;
    const { balance, transaction } = await adjustUserWallet(id, amount, description);

    return reply.send({ ok: true, balance, transaction });
  } catch (e: any) {
    if (e?.message === 'user_not_found') return reply.code(404).send({ message: 'user_not_found' });
    if (e?.message === 'invalid_amount') return reply.code(400).send({ message: 'invalid_amount' });

    req.log.error({ err: e }, 'POST /wallet/admin/users/:id/adjust failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}
