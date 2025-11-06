// src/modules/wallet/repository.ts
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  walletDepositRequests as wdr,
  walletTransactions as wtx,
} from "./schema";
import { users } from "@/modules/auth/schema";
import type {
  WalletDepositRequest,
  WalletDepositStatus,
  WalletTransaction,
  WalletTransactionType,
} from "./wallet.types";

/* ---------------- helpers ---------------- */
const toNum = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const toStrMoney = (n: number | string) => {
  const x = typeof n === "number" ? n : Number(n ?? 0);
  return x.toFixed(2); // DECIMAL alanlara string yazalım
};
const toMysqlDateTime = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

// "YYYY-MM-DD HH:mm:ss" parse
const parseMysqlish = (input: string): Date | null => {
  const s = input.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const withT = s.replace(" ", "T");
  const d = new Date(withT);
  return Number.isNaN(d.getTime()) ? null : d;
};

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

/* ================= Deposit Requests ================= */

export type WdrListParams = {
  user_id?: string;
  status?: WalletDepositStatus;
  order?: string; // "created_at.desc" | "amount.asc" ...
  limit?: number;
  offset?: number;
};

export async function listDepositRequests(p: WdrListParams) {
  const wh = [];
  if (p.user_id) wh.push(eq(wdr.userId, p.user_id));
  if (p.status)  wh.push(eq(wdr.status, p.status));
  const where = wh.length ? and(...wh) : undefined;

  const [col, dirRaw] = (p.order ?? "created_at.desc").split(".");
  const dir = dirRaw === "asc" ? "asc" : "desc";
  const orderBySql =
    col === "amount"     ? sql`amount ${sql.raw(dir)}`
  : col === "updated_at" ? sql`updated_at ${sql.raw(dir)}`
                         : sql`created_at ${sql.raw(dir)}`;

  const countQ = db.select({ c: sql<number>`COUNT(*)`.as("c") }).from(wdr);
  const countRows = where ? await countQ.where(where).execute() : await countQ.execute();
  const total = countRows[0]?.c ?? 0;

  const baseQ = db.select().from(wdr).orderBy(orderBySql).limit(p.limit ?? 100).offset(p.offset ?? 0);
  const rows = where ? await baseQ.where(where).execute() : await baseQ.execute();

  return { rows: rows.map(normalizeDeposit), total };
}

export async function createDepositRequest(body: {
  user_id: string;
  amount: number | string;
  payment_method?: string;
  payment_proof?: string | null;
}) {
  const id = randomUUID();
  const amount = toNum(body.amount);
  if (!amount || amount <= 0) throw new Error("invalid_amount");

  await db.insert(wdr).values({
    id,
    userId: body.user_id,
    amount: toStrMoney(amount),
    paymentMethod: body.payment_method ?? "havale",
    paymentProof: body.payment_proof ?? null,
    status: "pending",
  });

  const row = await db.select().from(wdr).where(eq(wdr.id, id)).limit(1).then(r => r[0]);
  return normalizeDeposit(row!);
}

export async function patchDepositRequest(
  id: string,
  patch: {
    status?: WalletDepositStatus;
    admin_notes?: string | null;
    payment_proof?: string | null;
    processed_at?: string | null;
  }
) {
  return await db.transaction(async (tx) => {
    // FOR UPDATE
    const locked = await tx.select().from(wdr).where(eq(wdr.id, id)).for("update").execute();
    const row = locked[0];
    if (!row) return null;

    const setParts: any[] = [];
    if (typeof patch.admin_notes !== "undefined") setParts.push(sql`admin_notes = ${patch.admin_notes}`);
    if (typeof patch.payment_proof !== "undefined") setParts.push(sql`payment_proof = ${patch.payment_proof}`);
    if (typeof patch.status !== "undefined") setParts.push(sql`status = ${patch.status}`);

    if (setParts.length) {
      await tx.execute(sql`UPDATE wallet_deposit_requests SET ${sql.join(setParts, sql`, `)} WHERE id = ${id}`);
    }

    if (typeof patch.processed_at !== "undefined") {
      if (patch.processed_at === null) {
        await tx.execute(sql`UPDATE wallet_deposit_requests SET processed_at = NULL WHERE id = ${id}`);
      } else {
        const parsed = parseMysqlish(patch.processed_at) ?? new Date();
        const s = toMysqlDateTime(parsed);
        await tx.execute(sql`UPDATE wallet_deposit_requests SET processed_at = ${s} WHERE id = ${id}`);
      }
    } else if (patch.status === "approved") {
      await tx.execute(sql`UPDATE wallet_deposit_requests SET processed_at = NOW(3) WHERE id = ${id}`);
    }

    // Onay -> txn + users.wallet_balance
    if (patch.status === "approved") {
      await tx.insert(wtx).values({
        id: randomUUID(),
        userId: row.userId,
        amount: row.amount, // DECIMAL string
        type: "deposit",
        description: `Bakiye yükleme onaylandı - ${row.paymentMethod}`,
        orderId: null,
      }).execute();

      await tx.execute(sql`
        UPDATE users
        SET wallet_balance = wallet_balance + ${row.amount}
        WHERE id = ${row.userId}
      `);
    }

    const out = await tx.select().from(wdr).where(eq(wdr.id, id)).limit(1).execute();
    return normalizeDeposit(out[0]!);
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
  const wh = [];
  if (p.user_id) wh.push(eq(wtx.userId, p.user_id));
  if (p.type)    wh.push(eq(wtx.type, p.type));
  const where = wh.length ? and(...wh) : undefined;

  const [col, dirRaw] = (p.order ?? "created_at.desc").split(".");
  const dir = dirRaw === "asc" ? "asc" : "desc";
  const orderBySql =
    col === "amount"
      ? sql`amount ${sql.raw(dir)}`
      : sql`created_at ${sql.raw(dir)}`;

  const countQ = db.select({ c: sql<number>`COUNT(*)`.as("c") }).from(wtx);
  const countRows = where ? await countQ.where(where).execute() : await countQ.execute();
  const total = countRows[0]?.c ?? 0;

  const baseQ = db.select().from(wtx).orderBy(orderBySql).limit(p.limit ?? 100).offset(p.offset ?? 0);
  const rows = where ? await baseQ.where(where).execute() : await baseQ.execute();

  return { rows: rows.map(normalizeTxn), total };
}

/* ================= Admin: Adjust User Wallet (atomik) ================= */

export async function adjustUserWallet(
  userId: string,
  amount: number,
  description?: string
): Promise<{
  balance: number;
  transaction: {
    id: string;
    user_id: string;
    amount: number;
    type: "deposit" | "withdrawal";
    description: string | null;
    created_at: string | Date;
  };
}> {
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("invalid_amount");
  }

  return db.transaction(async (tx) => {
    // 1) Kullanıcı bakiyesini al
    const curRows = await tx
      .select({ balance: users.wallet_balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (curRows.length === 0) throw new Error("user_not_found");

    const current = Number(curRows[0].balance as unknown as number);
    const next = Number((current + amount).toFixed(2));

    // 2) users.wallet_balance güncelle
    await tx
      .update(users)
      .set({
        wallet_balance: sql`${next}`, // DECIMAL literal
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    // 3) İşlem kaydı ekle (CAMEL CASE alan adları!)
    const id = randomUUID();
    const type: "deposit" | "withdrawal" = amount > 0 ? "deposit" : "withdrawal";
    const abs = Math.abs(amount);

    await tx.insert(wtx).values({
      id,
      userId,
      amount: toStrMoney(abs),
      type,
      description: description ?? null,
      orderId: null,
    });

    const txnRow = (await tx
      .select()
      .from(wtx)
      .where(eq(wtx.id, id))
      .limit(1))[0]!;

    // 4) FE’nin beklediği snake_case response
    return {
      balance: next,
      transaction: {
        id: txnRow.id,
        user_id: txnRow.userId,
        amount: Number(txnRow.amount as unknown as number),
        type, // sadece 'deposit' | 'withdrawal'
        description: txnRow.description ?? null,
        created_at: txnRow.createdAt,
      },
    };
  });
}
