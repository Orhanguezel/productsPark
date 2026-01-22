// =============================================================
// FILE: src/modules/wallet/repository.ts
// FINAL — Wallet repository (admin+public)
// - ✅ Source of truth: wallet_transactions SUM(amount) (signed ledger)
// - ✅ Idempotent approval: only first transition to approved credits ledger
// - ✅ Atomicity: user row lock (FOR UPDATE) to serialize balance-changing ops
// - ✅ Optional cache: users.wallet_balance is SET from ledger (no drift)
// =============================================================

import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { walletDepositRequests as wdr, walletTransactions as wtx } from './schema';
import type {
  WalletDepositRequest,
  WalletDepositStatus,
  WalletTransaction,
  WalletTransactionType,
} from './wallet.types';
import { users } from '@/modules/auth/schema';

/* ---------------- helpers ---------------- */

const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toStrMoney = (n: number | string) => {
  const x = typeof n === 'number' ? n : Number(n ?? 0);
  return (Number.isFinite(x) ? x : 0).toFixed(2);
};

const toMysqlDateTime = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19);

const parseMysqlish = (input: string): Date | null => {
  const s = String(input ?? '').trim();
  if (!s) return null;
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

function extractFirstRow(res: unknown): any | null {
  if (Array.isArray(res)) return res[0] ?? null;
  if (res && typeof res === 'object' && 'rows' in (res as any)) {
    const rows = (res as any).rows;
    return Array.isArray(rows) ? (rows[0] ?? null) : null;
  }
  return null;
}

/* ---------------- atomic primitives ---------------- */

/**
 * Serialize wallet-changing operations for a user.
 * This is the simplest reliable approach on MySQL/MariaDB.
 */
async function lockUserRow(txOrDb: typeof db, userId: string) {
  const res = await (txOrDb as any).execute(sql`
    SELECT id FROM users WHERE id = ${userId} FOR UPDATE
  `);
  const row = extractFirstRow(res);
  if (!row) throw new Error('user_not_found');
}

/**
 * Ledger balance (authoritative) inside a transaction.
 */
async function getUserWalletBalanceTx(txOrDb: typeof db, userId: string): Promise<number> {
  const rows = await (txOrDb as any)
    .select({
      balance: sql<string | number>`COALESCE(SUM(${wtx.amount}), 0)`.as('balance'),
    })
    .from(wtx)
    .where(eq(wtx.userId, userId))
    .execute();

  return toNum(rows?.[0]?.balance);
}

/**
 * Optional cache sync (users.wallet_balance) — NO increment/decrement.
 * Always set from ledger to prevent drift.
 */
async function syncUsersWalletBalanceFromLedger(
  txOrDb: typeof db,
  userId: string,
): Promise<number> {
  const bal = await getUserWalletBalanceTx(txOrDb, userId);
  const balStr = toStrMoney(bal);

  await (txOrDb as any).execute(sql`
    UPDATE users
    SET wallet_balance = ${balStr}, updated_at = NOW(3)
    WHERE id = ${userId}
  `);

  return bal;
}

/* ---------------- ✅ authoritative balance (wallet_transactions) ---------------- */

export async function getUserWalletBalance(userId: string): Promise<number> {
  const rows = await db
    .select({
      balance: sql<string | number>`COALESCE(SUM(${wtx.amount}), 0)`.as('balance'),
    })
    .from(wtx)
    .where(eq(wtx.userId, userId))
    .execute();

  return toNum(rows?.[0]?.balance);
}

/* ---------------- user label helpers ---------------- */

const trimOrNull = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

const toUserLabelFromEmail = (email: string): string => {
  const e = String(email || '').trim();
  if (!e) return '';
  return e.includes('@') ? e.split('@')[0] : e;
};

function computeUserLabel(args: {
  userId: string;
  fullName?: string | null;
  email?: string | null;
}) {
  const fn = trimOrNull(args.fullName);
  if (fn) return fn;

  const em = trimOrNull(args.email);
  if (em) return toUserLabelFromEmail(em);

  const id = String(args.userId || '');
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || 'Bilinmeyen';
}

/* ---------------- normalizers ---------------- */

const normalizeDeposit = (r: typeof wdr.$inferSelect): WalletDepositRequest => ({
  id: r.id,
  user_id: r.userId,
  amount: toNum(r.amount),
  payment_method: r.paymentMethod,
  payment_proof: r.paymentProof ?? null,
  status: r.status as WalletDepositStatus,
  admin_notes: r.adminNotes ?? null,
  processed_at: r.processedAt ? toMysqlDateTime(new Date(r.processedAt)) : null,
  created_at: toMysqlDateTime(new Date(r.createdAt)),
  updated_at: toMysqlDateTime(new Date(r.updatedAt)),
});

const normalizeTxn = (t: typeof wtx.$inferSelect): WalletTransaction => ({
  id: t.id,
  user_id: t.userId,
  amount: toNum(t.amount),
  type: t.type as WalletTransactionType,
  description: t.description ?? null,
  order_id: t.orderId ?? null,
  created_at: toMysqlDateTime(new Date(t.createdAt)),
});

/* ---------------- admin join types ---------------- */

type DepositJoinRow = {
  id: string;
  userId: string;
  amount: any;
  paymentMethod: string;
  paymentProof: string | null;
  status: string;
  adminNotes: string | null;
  processedAt: any;
  createdAt: any;
  updatedAt: any;

  userFullName: string | null;
  userEmail: string | null;
};

export type WalletDepositRequestRow = WalletDepositRequest & {
  user_full_name: string;
  user_email: string | null;
};

const normalizeDepositWithUser = (r: DepositJoinRow): WalletDepositRequestRow => {
  const base: WalletDepositRequest = {
    id: r.id,
    user_id: r.userId,
    amount: toNum(r.amount),
    payment_method: r.paymentMethod,
    payment_proof: r.paymentProof ?? null,
    status: r.status as WalletDepositStatus,
    admin_notes: r.adminNotes ?? null,
    processed_at: r.processedAt ? toMysqlDateTime(new Date(r.processedAt)) : null,
    created_at: toMysqlDateTime(new Date(r.createdAt)),
    updated_at: toMysqlDateTime(new Date(r.updatedAt)),
  };

  return {
    ...base,
    user_full_name: computeUserLabel({
      userId: base.user_id,
      fullName: r.userFullName ?? null,
      email: r.userEmail ?? null,
    }),
    user_email: r.userEmail ?? null,
  };
};

/* ================= Deposit Requests ================= */

export type WdrListParams = {
  user_id?: string;
  status?: WalletDepositStatus;
  order?: string;
  limit?: number;
  offset?: number;
};

export async function listDepositRequests(p: WdrListParams) {
  const wh: any[] = [];
  if (p.user_id) wh.push(eq(wdr.userId, p.user_id));
  if (p.status) wh.push(eq(wdr.status, p.status));
  const where = wh.length ? and(...wh) : undefined;

  const [col, dirRaw] = String(p.order ?? 'created_at.desc').split('.');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';

  const orderBySql =
    col === 'amount'
      ? sql`wallet_deposit_requests.amount ${sql.raw(dir)}`
      : col === 'updated_at'
        ? sql`wallet_deposit_requests.updated_at ${sql.raw(dir)}`
        : sql`wallet_deposit_requests.created_at ${sql.raw(dir)}`;

  const countQ = db.select({ c: sql<number>`COUNT(*)`.as('c') }).from(wdr);
  const countRows = where ? await countQ.where(where).execute() : await countQ.execute();
  const total = countRows[0]?.c ?? 0;

  const limit = typeof p.limit === 'number' ? p.limit : 100;
  const offset = typeof p.offset === 'number' ? p.offset : 0;

  const selectObj = {
    id: wdr.id,
    userId: wdr.userId,
    amount: wdr.amount,
    paymentMethod: wdr.paymentMethod,
    paymentProof: wdr.paymentProof,
    status: wdr.status,
    adminNotes: wdr.adminNotes,
    processedAt: wdr.processedAt,
    createdAt: wdr.createdAt,
    updatedAt: wdr.updatedAt,
    userFullName: users.full_name,
    userEmail: users.email,
  };

  const rows = where
    ? await db
        .select(selectObj)
        .from(wdr)
        .leftJoin(users, eq(users.id, wdr.userId))
        .where(where)
        .orderBy(orderBySql)
        .limit(limit)
        .offset(offset)
        .execute()
    : await db
        .select(selectObj)
        .from(wdr)
        .leftJoin(users, eq(users.id, wdr.userId))
        .orderBy(orderBySql)
        .limit(limit)
        .offset(offset)
        .execute();

  return { rows: rows.map((r) => normalizeDepositWithUser(r as unknown as DepositJoinRow)), total };
}

export async function createDepositRequest(body: {
  user_id: string;
  amount: number | string;
  payment_method?: string;
  payment_proof?: string | null;
}) {
  const id = randomUUID();
  const amount = toNum(body.amount);
  if (!amount || amount <= 0) throw new Error('invalid_amount');

  // ✅ ensure user exists early (prevents orphan deposit requests)
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, body.user_id))
    .limit(1);
  if (!u) throw new Error('user_not_found');

  await db.insert(wdr).values({
    id,
    userId: body.user_id,
    amount: toStrMoney(amount),
    paymentMethod: body.payment_method ?? 'havale',
    paymentProof: body.payment_proof ?? null,
    status: 'pending',
  });

  const row = await db
    .select()
    .from(wdr)
    .where(eq(wdr.id, id))
    .limit(1)
    .then((r) => r[0]);

  return normalizeDeposit(row!);
}

export type PatchDepositResult = {
  item: WalletDepositRequestRow;
  justApproved: boolean;
};

export async function patchDepositRequest(
  id: string,
  patch: {
    status?: WalletDepositStatus;
    admin_notes?: string | null;
    payment_proof?: string | null;
    processed_at?: string | null;
  },
): Promise<PatchDepositResult | null> {
  return await db.transaction(async (tx) => {
    const locked = await tx.select().from(wdr).where(eq(wdr.id, id)).for('update').execute();
    const row = locked[0];
    if (!row) return null;

    const prevStatus = row.status as WalletDepositStatus;
    const nextStatus = (patch.status ?? prevStatus) as WalletDepositStatus;
    const justApproved = prevStatus !== 'approved' && nextStatus === 'approved';

    const setParts: any[] = [];
    if (typeof patch.admin_notes !== 'undefined')
      setParts.push(sql`admin_notes = ${patch.admin_notes}`);
    if (typeof patch.payment_proof !== 'undefined')
      setParts.push(sql`payment_proof = ${patch.payment_proof}`);
    if (typeof patch.status !== 'undefined') setParts.push(sql`status = ${nextStatus}`);

    if (setParts.length) {
      await tx.execute(sql`
        UPDATE wallet_deposit_requests
        SET ${sql.join(setParts, sql`, `)}
        WHERE id = ${id}
      `);
    }

    if (typeof patch.processed_at !== 'undefined') {
      if (patch.processed_at === null) {
        await tx.execute(
          sql`UPDATE wallet_deposit_requests SET processed_at = NULL WHERE id = ${id}`,
        );
      } else {
        const parsed = parseMysqlish(patch.processed_at) ?? new Date();
        await tx.execute(sql`
          UPDATE wallet_deposit_requests
          SET processed_at = ${toMysqlDateTime(parsed)}
          WHERE id = ${id}
        `);
      }
    } else if (justApproved) {
      await tx.execute(
        sql`UPDATE wallet_deposit_requests SET processed_at = NOW(3) WHERE id = ${id}`,
      );
    }

    if (justApproved) {
      // ✅ Serialize user wallet updates (prevents double-credit races)
      await lockUserRow(tx as any, row.userId);

      // ✅ Insert transaction (authoritative ledger)
      await tx.insert(wtx).values({
        id: randomUUID(),
        userId: row.userId,
        amount: row.amount, // positive
        type: 'deposit',
        description: `Bakiye yükleme onaylandı - ${row.paymentMethod}`,
        orderId: null,
      });

      // ✅ Optional cache sync: SET from ledger (no drift)
      await syncUsersWalletBalanceFromLedger(tx as any, row.userId);
    }

    const out = await tx
      .select({
        id: wdr.id,
        userId: wdr.userId,
        amount: wdr.amount,
        paymentMethod: wdr.paymentMethod,
        paymentProof: wdr.paymentProof,
        status: wdr.status,
        adminNotes: wdr.adminNotes,
        processedAt: wdr.processedAt,
        createdAt: wdr.createdAt,
        updatedAt: wdr.updatedAt,
        userFullName: users.full_name,
        userEmail: users.email,
      })
      .from(wdr)
      .leftJoin(users, eq(users.id, wdr.userId))
      .where(eq(wdr.id, id))
      .limit(1)
      .execute();

    const j = out[0];
    if (!j) return null;

    return {
      item: normalizeDepositWithUser(j as unknown as DepositJoinRow),
      justApproved,
    };
  });
}

/* ================= Wallet Transactions ================= */

export type WtxnListParams = {
  user_id?: string;
  type?: WalletTransactionType;
  order?: string;
  limit?: number;
  offset?: number;
};

export async function listWalletTransactions(p: WtxnListParams) {
  const wh: any[] = [];
  if (p.user_id) wh.push(eq(wtx.userId, p.user_id));
  if (p.type) wh.push(eq(wtx.type, p.type));
  const where = wh.length ? and(...wh) : undefined;

  const [col, dirRaw] = String(p.order ?? 'created_at.desc').split('.');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';

  const orderBySql =
    col === 'amount' ? sql`amount ${sql.raw(dir)}` : sql`created_at ${sql.raw(dir)}`;

  const countQ = db.select({ c: sql<number>`COUNT(*)`.as('c') }).from(wtx);
  const countRows = where ? await countQ.where(where).execute() : await countQ.execute();
  const total = countRows[0]?.c ?? 0;

  const baseQ = db
    .select()
    .from(wtx)
    .orderBy(orderBySql)
    .limit(p.limit ?? 100)
    .offset(p.offset ?? 0);

  const rows = where ? await baseQ.where(where).execute() : await baseQ.execute();
  return { rows: rows.map(normalizeTxn), total };
}

/* ================= Admin: Adjust User Wallet (atomic, ledger-based) ================= */

export async function adjustUserWallet(userId: string, amount: number, description?: string) {
  if (!Number.isFinite(amount) || amount === 0) throw new Error('invalid_amount');

  return db.transaction(async (tx) => {
    // ✅ serialize
    await lockUserRow(tx as any, userId);

    // ✅ ledger balance
    const current = await getUserWalletBalanceTx(tx as any, userId);
    const next = Number((current + amount).toFixed(2));

    const id = randomUUID();
    const type: 'deposit' | 'withdrawal' = amount > 0 ? 'deposit' : 'withdrawal';

    // NOTE: signed model (amount can be negative)
    await tx.insert(wtx).values({
      id,
      userId,
      amount: toStrMoney(amount),
      type,
      description: description ?? null,
      orderId: null,
    });

    // ✅ optional cache sync: SET from ledger
    await syncUsersWalletBalanceFromLedger(tx as any, userId);

    const txnRow = (await tx.select().from(wtx).where(eq(wtx.id, id)).limit(1))[0]!;

    return {
      balance: next,
      transaction: {
        id: txnRow.id,
        user_id: txnRow.userId,
        amount: toNum(txnRow.amount),
        type,
        description: txnRow.description ?? null,
        created_at: toMysqlDateTime(new Date(txnRow.createdAt)),
      },
    };
  });
}
