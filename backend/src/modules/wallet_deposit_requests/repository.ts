import { pool } from "@/db/client";
import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import { projectColumns, parseOrder, toNumber } from "@/db/seed/utils";
import { insertDepositTxn } from "@/modules/wallet_transactions/repository";

export type WalletDepositRequest = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_proof: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WdrListParams = {
  select?: string;
  user_id?: string;
  status?: WalletDepositRequest["status"];
  order?: string;
  limit?: number;
  offset?: number;
};

export async function listDepositRequests(p: WdrListParams) {
  const allowed = ["id","user_id","amount","payment_method","payment_proof","status","admin_notes","processed_at","created_at","updated_at"];
  const select = projectColumns(p.select, allowed);
  const { col, dir } = parseOrder(p.order, allowed, "created_at", "desc");

  const where: string[] = [];
  const params: any[] = [];

  if (p.user_id) { where.push("user_id = ?"); params.push(p.user_id); }
  if (p.status)  { where.push("status = ?");  params.push(p.status); }

  let sql = `SELECT ${select} FROM wallet_deposit_requests`;
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY ${col} ${dir}`;

  const countSql = `SELECT COUNT(*) AS c FROM wallet_deposit_requests${where.length ? ` WHERE ${where.join(" AND ")}` : ""}`;

  if (Number.isFinite(p.limit))  sql += ` LIMIT ${p.limit}`;
  if (Number.isFinite(p.offset)) sql += ` OFFSET ${p.offset}`;

  const [countRows] = await pool.query(countSql, params);
  const total = Number((countRows as any[])[0]?.c ?? 0);

  const [rows] = await pool.query(sql, params);
  return { rows: rows as WalletDepositRequest[], total };
}

export async function createDepositRequest(body: {
  user_id: string;
  amount: number | string;
  payment_method?: string;
  payment_proof?: string | null;
}) {
  const id = randomUUID();
  const now = new Date();
  const amt = toNumber(body.amount);
  if (amt == null || amt <= 0) throw new Error("invalid_amount");

  await pool.execute(
    `INSERT INTO wallet_deposit_requests
     (id, user_id, amount, payment_method, payment_proof, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, body.user_id, amt, body.payment_method ?? "havale", body.payment_proof ?? null, now, now]
  );

  const [rows] = await pool.query(
    `SELECT id, user_id, amount, payment_method, payment_proof, status, admin_notes, processed_at, created_at, updated_at
     FROM wallet_deposit_requests WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows as WalletDepositRequest[]; // FE: tek elemanlı dizi bekliyor
}

export async function patchDepositRequest(id: string, patch: {
  status?: WalletDepositRequest["status"];
  admin_notes?: string | null;
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rr] = await conn.query(`SELECT * FROM wallet_deposit_requests WHERE id = ? FOR UPDATE`, [id]);
    const row = Array.isArray(rr) && rr[0] ? (rr[0] as any) : null;
    if (!row) { await conn.rollback(); return null; }

    const sets: string[] = ["updated_at = NOW()"];
    const vals: any[] = [];

    if (typeof patch.admin_notes === "string") { sets.push("admin_notes = ?"); vals.push(patch.admin_notes); }
    if (patch.status) {
      sets.push("status = ?"); vals.push(patch.status);
      if (patch.status === "approved") sets.push("processed_at = NOW()");
    }

    await conn.execute(`UPDATE wallet_deposit_requests SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);

    if (patch.status === "approved") {
      const txnId = randomUUID();
      const desc = `Bakiye yükleme onaylandı - ${row.payment_method}`;
      await insertDepositTxn(conn as unknown as PoolConnection, {
        id: txnId,
        user_id: row.user_id,
        amount: Number(row.amount),
        description: desc,
      });
      try {
        await conn.execute(
          `UPDATE profiles SET wallet_balance = wallet_balance + ? WHERE id = ?`,
          [row.amount, row.user_id]
        );
      } catch { /* profiles tablosu yoksa sessiz geç */ }
    }

    await conn.commit();

    const [out] = await pool.query(
      `SELECT id, user_id, amount, payment_method, payment_proof, status, admin_notes, processed_at, created_at, updated_at
       FROM wallet_deposit_requests WHERE id = ? LIMIT 1`,
      [id]
    );
    return out as WalletDepositRequest[];
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
