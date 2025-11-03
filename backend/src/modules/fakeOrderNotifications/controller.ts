import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateBodySchema, UpdateBodySchema, IdParamSchema, ListQuerySchema } from "./validation";

/** Minimal MySQL face */
type MySQL = { query<T = unknown[]>(sql: string, params?: unknown[]): Promise<[T, unknown]> };

// controller.ts içindeki getMysql'i değiştir
function getMysql(req: FastifyRequest) {
  const s = req.server;
  const db = s.mysql ?? req.mysql ?? s.db ?? s.mariadb ?? null;
  if (!db?.query) throw new Error("MySQL pool not found (fastify.mysql).");
  return db;
}


const truthy = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";
const toIso = (v: unknown) =>
  v instanceof Date ? v.toISOString() : typeof v === "string" ? v : String(v ?? "");

type DbRow = {
  id: string;
  product_name: string;
  customer: string;
  location: string | null;
  time_ago: string;
  is_active: 0 | 1;
  created_at: string | Date;
};

type View = {
  id: string;
  product_name: string;
  customer: string;
  location: string | null;
  time_ago: string;
  is_active: boolean;
  created_at: string;
};

function rowToView(row: DbRow): View {
  return {
    id: row.id,
    product_name: row.product_name,
    customer: row.customer,
    location: row.location,
    time_ago: row.time_ago,
    is_active: row.is_active === 1,
    created_at: toIso(row.created_at),
  };
}

function parseOrder(raw?: string) {
  const fallback = "created_at.desc";
  const allow = ["product_name", "customer", "created_at"];
  if (!raw) raw = fallback;
  const s = raw.toLowerCase().trim();
  if (s === "asc" || s === "desc") {
    return { col: fallback.split(".")[0], dir: s === "desc" ? "DESC" : "ASC" };
  }
  const [maybeCol, maybeDir] = s.split(".");
  const col = allow.includes(maybeCol) ? maybeCol : "created_at";
  const dir = maybeDir === "asc" ? "ASC" : "DESC";
  return { col, dir };
}

/* ============ ADMIN ============ */

export async function adminListFakeOrders(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const q = ListQuerySchema.parse(req.query);

  const conds: string[] = [];
  const params: unknown[] = [];

  if (q.is_active !== undefined) {
    conds.push("is_active = ?");
    params.push(truthy(q.is_active) ? 1 : 0);
  }
  if (q.q) {
    conds.push("(product_name LIKE ? OR customer LIKE ? OR location LIKE ?)");
    params.push(`%${q.q}%`, `%${q.q}%`, `%${q.q}%`);
  }

  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
  const { col, dir } = parseOrder(q.order);
  const limit = q.limit ?? 50;
  const offset = q.offset ?? 0;

  const sql = `
    SELECT id, product_name, customer, location, time_ago, is_active, created_at
    FROM fake_order_notifications
    ${where}
    ORDER BY ${col} ${dir}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await mysql.query<DbRow[]>(sql, [...params, limit, offset]);
  return reply.send(rows.map(rowToView));
}

export async function adminGetFakeOrder(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);

  const [rows] = await mysql.query<DbRow[]>(
    `SELECT id, product_name, customer, location, time_ago, is_active, created_at
     FROM fake_order_notifications WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows?.length) return reply.code(404).send({ message: "not_found" });
  return reply.send(rowToView(rows[0]));
}

export async function adminCreateFakeOrder(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const body = CreateBodySchema.parse(req.body);

  const [uuidRows] = await mysql.query<Array<{ id: string }>>(`SELECT UUID() AS id`);
  const newId = uuidRows[0].id;

  await mysql.query(
    `INSERT INTO fake_order_notifications
      (id, product_name, customer, location, time_ago, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(3))`,
    [newId, body.product_name, body.customer, body.location ?? null, body.time_ago, body.is_active ? 1 : 0]
  );

  const [rows] = await mysql.query<DbRow[]>(
    `SELECT id, product_name, customer, location, time_ago, is_active, created_at
     FROM fake_order_notifications WHERE id = ?`,
    [newId]
  );
  return reply.code(201).send(rowToView(rows[0]));
}

export async function adminUpdateFakeOrder(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  const patch = UpdateBodySchema.parse(req.body);

  const [exists] = await mysql.query<DbRow[]>(
    `SELECT id FROM fake_order_notifications WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!exists?.length) return reply.code(404).send({ message: "not_found" });

  const fields: string[] = [];
  const params: unknown[] = [];

  if (patch.product_name !== undefined) { fields.push("product_name = ?"); params.push(patch.product_name); }
  if (patch.customer !== undefined)     { fields.push("customer = ?"); params.push(patch.customer); }
  if (patch.location !== undefined)     { fields.push("location = ?"); params.push(patch.location ?? null); }
  if (patch.time_ago !== undefined)     { fields.push("time_ago = ?"); params.push(patch.time_ago); }
  if (patch.is_active !== undefined)    { fields.push("is_active = ?"); params.push(patch.is_active ? 1 : 0); }

  if (fields.length === 0) return reply.code(400).send({ message: "empty_body" });

  params.push(id);
  await mysql.query(`UPDATE fake_order_notifications SET ${fields.join(", ")} WHERE id = ?`, params);

  const [rows] = await mysql.query<DbRow[]>(
    `SELECT id, product_name, customer, location, time_ago, is_active, created_at
     FROM fake_order_notifications WHERE id = ?`,
    [id]
  );
  return reply.send(rowToView(rows[0]));
}

export async function adminDeleteFakeOrder(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  await mysql.query(`DELETE FROM fake_order_notifications WHERE id = ?`, [id]);
  return reply.code(204).send();
}

/* ============ PUBLIC (toast) ============ */

export async function publicListFakeOrders(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  // sadece aktif ve random 20 kayıt
  const [rows] = await mysql.query<DbRow[]>(
    `SELECT id, product_name, customer, location, time_ago, is_active, created_at
     FROM fake_order_notifications
     WHERE is_active = 1
     ORDER BY RAND()
     LIMIT 20`
  );
  return reply.send(rows.map(rowToView));
}

export async function publicRandomFakeOrder(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const [rows] = await mysql.query<DbRow[]>(
    `SELECT id, product_name, customer, location, time_ago, is_active, created_at
     FROM fake_order_notifications
     WHERE is_active = 1
     ORDER BY RAND()
     LIMIT 1`
  );
  if (!rows?.length) return reply.code(404).send({ message: "not_found" });
  return reply.send(rowToView(rows[0]));
}
