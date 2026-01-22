// =============================================================
// FILE: src/modules/wallet/controller.ts
// FINAL — Public Wallet Controller (me + create deposit)
// - ✅ userId: trim + UUID validate (prevents blank/invalid ids)
// - ✅ /me/balance returns a number (computed from wallet_transactions)
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq, sql } from 'drizzle-orm';

import { createDepositRequest, getUserWalletBalance, listWalletTransactions } from './repository';
import { WdrCreateBodySchema, WtxnListQuerySchema } from './validation';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { sendTemplatedEmail } from '@/modules/email-templates/mailer';
import { sendTelegramEvent } from '@/modules/telegram/service';

/* ---------------- auth helper ---------------- */

type JwtUser = { sub?: unknown; id?: unknown };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserIdFromReq(req: FastifyRequest): string {
  const payload = (req as any).user as JwtUser | undefined;
  const raw = payload?.id ?? payload?.sub ?? null;
  if (raw == null) throw new Error('unauthorized');

  const userId = String(raw).trim();
  if (!userId) throw new Error('unauthorized');
  if (!UUID_RE.test(userId)) throw new Error('unauthorized');

  return userId;
}

const getLocaleFromReq = (req: FastifyRequest): string | undefined => {
  const header =
    (req.headers['x-locale'] as string | undefined) ||
    (req.headers['accept-language'] as string | undefined);

  const first = header?.split(',')[0]?.trim();
  return first ? first.slice(0, 10) : undefined;
};

function toUserLabelFromEmail(email: string): string {
  const e = String(email || '').trim();
  if (!e) return '';
  return e.includes('@') ? e.split('@')[0] : e;
}

/* ---------------- site name helper ---------------- */
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

/* ---------------- telegram helpers ---------------- */
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

async function notifyNewDepositRequestTelegram(args: {
  deposit: { user_id: string; amount: number; payment_method?: string | null; created_at?: Date };
}) {
  const siteName = await getSiteName();
  await sendTelegramEvent({
    event: 'new_deposit_request',
    data: {
      site_name: siteName,
      user_name: await getUserLabel(args.deposit.user_id),
      amount: args.deposit.amount.toFixed(2),
      payment_method: args.deposit.payment_method ?? '—',
      created_at: (args.deposit.created_at ?? new Date()).toLocaleString('tr-TR'),
    },
  });
}

/* ---------------- email helper (fail-safe) ---------------- */
async function sendDepositRequestCreatedEmail(args: {
  req: FastifyRequest;
  user_id: string;
  amount: number;
  payment_method: string;
}) {
  const { req, user_id, amount, payment_method } = args;

  const [u] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, user_id))
    .limit(1);
  if (!u?.email) return;

  const locale = getLocaleFromReq(req);
  const siteName = await getSiteName();

  await sendTemplatedEmail({
    to: u.email,
    key: 'deposit_request_created',
    locale: locale ?? null,
    params: {
      user_name: toUserLabelFromEmail(u.email),
      amount: amount.toFixed(2),
      payment_method,
      site_name: siteName,
    },
  });
}

/* ---------------- controllers (public) ---------------- */

export async function createDepositRequestCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = WdrCreateBodySchema.safeParse(((req as any).body ?? {}) as unknown);
    if (!parsed.success) return reply.code(400).send({ message: 'invalid_body' });

    const userId = getUserIdFromReq(req);

    const item = await createDepositRequest({
      user_id: userId, // ✅ JWT overrides any FE user_id
      amount: parsed.data.amount,
      payment_method: parsed.data.payment_method,
      payment_proof: parsed.data.payment_proof ?? null,
    });

    // Email (fail-safe)
    try {
      await sendDepositRequestCreatedEmail({
        req,
        user_id: item.user_id,
        amount: Number(item.amount),
        payment_method: item.payment_method || 'havale',
      });
    } catch (err) {
      req.log.error({ err }, 'deposit_request_email_failed');
    }

    // Telegram (fail-safe)
    try {
      await notifyNewDepositRequestTelegram({
        deposit: {
          user_id: item.user_id,
          amount: Number(item.amount),
          payment_method: item.payment_method ?? null,
          created_at: new Date(),
        },
      });
    } catch (err) {
      req.log.error({ err }, 'deposit_request_telegram_failed');
    }

    return reply.code(201).send(item);
  } catch (e: any) {
    req.log.error(e, 'POST /wallet/deposit_requests failed');
    if (e?.message === 'invalid_amount') return reply.code(400).send({ message: 'invalid_amount' });
    if (e?.message === 'user_not_found') return reply.code(404).send({ message: 'user_not_found' });
    if (e?.message === 'unauthorized') return reply.code(401).send({ message: 'unauthorized' });
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}

export async function meWalletBalanceCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getUserIdFromReq(req);

    // ✅ computed from wallet_transactions (repository)
    const balance = await getUserWalletBalance(userId);

    return reply.send(balance);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ message: 'unauthorized' });
    req.log.error(e, 'GET /wallet/me/balance failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}

export async function meWalletTransactionsCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getUserIdFromReq(req);

    const parsed = WtxnListQuerySchema.safeParse((req as any).query);
    const safe = parsed.success ? parsed.data : {};

    const { rows, total } = await listWalletTransactions({
      user_id: userId,
      limit: typeof safe.limit === 'number' ? safe.limit : 100,
      offset: typeof safe.offset === 'number' ? safe.offset : 0,
      order: typeof safe.order === 'string' ? safe.order : 'created_at.desc',
    });

    reply.header('x-total-count', String(total));
    return rows;
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ message: 'unauthorized' });
    req.log.error(e, 'GET /wallet/me/transactions failed');
    return reply.code(500).send({ message: 'request_failed_500' });
  }
}
