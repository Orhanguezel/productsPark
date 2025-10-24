import { pool } from "@/db/client";
import { projectColumns, parseOrder } from "@/db/seed/utils";
import type { PoolConnection } from "mysql2/promise";

export type WalletTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "purchase" | "refund";
  description: string | null;
  order_id: string | null;
  created_at: string;
};

export type WalletTxnListParams = {
  select?: string;
  user_id?: string;
  type?: WalletTransaction["type"];
  order?: string; // "created_at.desc" | "created_at.asc"
  limit?: number;
  offset?: number;
};

export async function listWalletTransactions(p: WalletTxnListParams) {
  const allowed = ["id","user_id","amount","type","description","order_id","created_at"];
  const select = projectColumns(p.select, allowed);
  const { col, dir } = parseOrder(p.order, allowed, "created_at", "desc");

  const where: string[] = [];
  const params: any[] = [];

  if (p.user_id) { where.push("user_id = ?"); params.push(p.user_id); }
  if (p.type && ["deposit","withdrawal","purchase","refund"].includes(p.type)) {
    where.push("type = ?"); params.push(p.type);
  }

  let sql = `SELECT ${select} FROM wallet_transactions`;
  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY ${col} ${dir}`;

  const countSql = `SELECT COUNT(*) AS c FROM wallet_transactions${where.length ? ` WHERE ${where.join(" AND ")}` : ""}`;

  if (Number.isFinite(p.limit))  sql += ` LIMIT ${p.limit}`;
  if (Number.isFinite(p.offset)) sql += ` OFFSET ${p.offset}`;

  // ✅ Tek köşeli destructure
  const [countRows] = await pool.query(countSql, params);
  const total = Number((countRows as any[])[0]?.c ?? 0);

  const [rows] = await pool.query(sql, params);
  return { rows: rows as WalletTransaction[], total };
}

/** deposit onayı sırasında ortak kullanım */
export async function insertDepositTxn(
  conn: PoolConnection,
  args: { id: string; user_id: string; amount: number; description: string }
) {
  await conn.execute(
    `INSERT INTO wallet_transactions
     (id, user_id, amount, type, description, order_id, created_at)
     VALUES (?, ?, ?, 'deposit', ?, NULL, NOW())`,
    [args.id, args.user_id, args.amount, args.description]
  );
}
