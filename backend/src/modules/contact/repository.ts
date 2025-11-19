// =============================================================
// FILE: src/modules/contact/repository.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import type {
  ContactCreateInput,
  ContactListParams,
  ContactUpdateInput,
} from "./validation";
import type { ContactView } from "./schema";
import { randomUUID } from "node:crypto";

function mapRow(r: any): ContactView {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    subject: r.subject,
    message: r.message,
    status: r.status,
    is_resolved: Number(r.is_resolved) === 1,
    admin_note: r.admin_note,
    ip: r.ip,
    user_agent: r.user_agent,
    website: r.website,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function safeOrderBy(col?: string) {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "status":
    case "name":
      return col;
    default:
      return "created_at";
  }
}

export async function repoCreateContact(
  app: FastifyInstance,
  body: ContactCreateInput & { ip?: string | null; user_agent?: string | null }
): Promise<ContactView> {
  const mysql = (app as any).mysql;
  const id = randomUUID();

  await mysql.query(
    `
    INSERT INTO contact_messages
    (id, name, email, phone, subject, message, status, is_resolved, admin_note, ip, user_agent, website, created_at, updated_at)
    VALUES
    (?, ?, ?, ?, ?, ?, 'new', 0, NULL, ?, ?, ?, NOW(3), NOW(3))
    `,
    [
      id,
      body.name.trim(),
      body.email.trim().toLowerCase(),
      body.phone.trim(),
      body.subject.trim(),
      body.message.trim(),
      body.ip ?? null,
      body.user_agent ?? null,
      body.website ?? null,
    ]
  );

  const [rows] = await mysql.query(`SELECT * FROM contact_messages WHERE id = ? LIMIT 1`, [id]);
  return mapRow((rows as any[])[0]);
}

export async function repoGetContactById(
  app: FastifyInstance,
  id: string
): Promise<ContactView | null> {
  const mysql = (app as any).mysql;
  const [rows] = await mysql.query(`SELECT * FROM contact_messages WHERE id = ? LIMIT 1`, [id]);
  const row = (rows as any[])[0];
  return row ? mapRow(row) : null;
}

export async function repoListContacts(
  app: FastifyInstance,
  params: ContactListParams
): Promise<ContactView[]> {
  const mysql = (app as any).mysql;
  const {
    search,
    status,
    resolved,
    limit = 50,
    offset = 0,
    orderBy,
    order = "desc",
  } = params;

  const where: string[] = [];
  const binds: any[] = [];

  if (search) {
    const q = `%${search}%`;
    where.push(
      `(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)`
    );
    binds.push(q, q, q, q, q);
  }
  if (typeof status !== "undefined") {
    where.push(`status = ?`);
    binds.push(status);
  }
  if (typeof resolved === "boolean") {
    where.push(`is_resolved = ?`);
    binds.push(resolved ? 1 : 0);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderCol = safeOrderBy(orderBy);
  const orderDir = order?.toLowerCase() === "asc" ? "ASC" : "DESC";

  const sql = `
    SELECT *
    FROM contact_messages
    ${whereSql}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await mysql.query(sql, [...binds, Number(limit), Number(offset)]);
  return (rows as any[]).map(mapRow);
}

export async function repoCountContacts(
  app: FastifyInstance,
  params: ContactListParams
): Promise<number> {
  const mysql = (app as any).mysql;
  const { search, status, resolved } = params;

  const where: string[] = [];
  const binds: any[] = [];

  if (search) {
    const q = `%${search}%`;
    where.push(
      `(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)`
    );
    binds.push(q, q, q, q, q);
  }
  if (typeof status !== "undefined") {
    where.push(`status = ?`);
    binds.push(status);
  }
  if (typeof resolved === "boolean") {
    where.push(`is_resolved = ?`);
    binds.push(resolved ? 1 : 0);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await mysql.query(
    `SELECT COUNT(*) as c FROM contact_messages ${whereSql}`,
    binds
  );
  return Number((rows as any[])[0]?.c ?? 0);
}

export async function repoUpdateContact(
  app: FastifyInstance,
  id: string,
  body: ContactUpdateInput
): Promise<ContactView | null> {
  const mysql = (app as any).mysql;

  const fields: string[] = [];
  const binds: any[] = [];

  if (typeof body.status !== "undefined") {
    fields.push(`status = ?`);
    binds.push(body.status);
  }
  if (typeof body.is_resolved === "boolean") {
    fields.push(`is_resolved = ?`);
    binds.push(body.is_resolved ? 1 : 0);
  }
  if (typeof body.admin_note !== "undefined") {
    fields.push(`admin_note = ?`);
    binds.push(body.admin_note ?? null);
  }

  if (!fields.length) {
    return await repoGetContactById(app, id);
  }

  const sql = `
    UPDATE contact_messages
    SET ${fields.join(", ")}, updated_at = NOW(3)
    WHERE id = ?
    LIMIT 1
  `;
  await mysql.query(sql, [...binds, id]);
  return await repoGetContactById(app, id);
}

export async function repoDeleteContact(
  app: FastifyInstance,
  id: string
): Promise<boolean> {
  const mysql = (app as any).mysql;
  const [res] = await mysql.query(`DELETE FROM contact_messages WHERE id = ? LIMIT 1`, [id]);
  return (res?.affectedRows ?? 0) > 0;
}
