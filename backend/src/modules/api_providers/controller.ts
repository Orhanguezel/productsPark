// src/modules/api_providers/controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { ListQuerySchema, IdParamSchema, CreateBodySchema, UpdateBodySchema } from "./validation";
import type { ApiProviderView, ApiProviderCredentials } from "./schema";

/** MySQL promise pool'un ihtiyacımız olan minimal yüzeyi */
type MySQL = {
  query<T = any[]>(sql: string, params?: any[]): Promise<[T, any]>;
};

/** fastify-mysql dekorasyonunu güvenle yakala (alias'lar dahil) */
function getMysql(req: FastifyRequest): MySQL {
  const s = req.server as any;
  const r = req as any;
  const db =
    s.mysql ??     // @fastify/mysql (önerilen)
    r.mysql ??     // bazı projelerde request'e de eklenebiliyor
    s.db ??        // olası genel alias
    s.mariadb ??   // mariadb adıyla eklenmiş olabilir
    null;

  if (!db?.query) {
    throw new Error("MySQL pool not found. Make sure a pool is decorated as fastify.mysql (or alias).");
  }
  return db as MySQL;
}

/** küçük yardımcılar */
const truthy = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";
const toIso = (v: unknown) =>
  v instanceof Date ? v.toISOString() : typeof v === "string" ? v : String(v ?? "");

function parseOrder(raw: string | undefined, allow: string[], fallback = "name.asc") {
  if (!raw) raw = fallback;
  const s = raw.toLowerCase().trim();

  // "asc" / "desc" kısa kullanımı → fallback kolonda sırala
  if (s === "asc" || s === "desc") {
    return { col: fallback.split(".")[0], dir: s === "desc" ? "DESC" : "ASC" };
  }

  // "col" veya "col.dir"
  const [maybeCol, maybeDir] = s.split(".");
  const col = allow.includes(maybeCol) ? maybeCol : fallback.split(".")[0];
  const dir = maybeDir === "desc" ? "DESC" : "ASC";
  return { col, dir };
}

/** DB satırı tipi */
type ApiProviderDbRow = {
  id: string;
  name: string;
  type: string;               // DB kolon adı
  credentials: string;        // JSON (LONGTEXT)
  is_active: 0 | 1;
  created_at: string | Date;
  updated_at: string | Date;
};

/** DB satırını FE görünümüne çevir */
function rowToView(row: ApiProviderDbRow): ApiProviderView {
  let creds: ApiProviderCredentials = {};
  try {
    creds = row.credentials ? (JSON.parse(row.credentials) as ApiProviderCredentials) : {};
  } catch {
    creds = {};
  }

  return {
    id: row.id,
    name: row.name,
    provider_type: row.type,
    api_url: (creds.api_url as string | undefined) ?? null,
    api_key: (creds.api_key as string | undefined) ?? null,
    is_active: row.is_active === 1,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    credentials: creds,
  };
}

/** GET /admin/api-providers */
export async function adminListApiProviders(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const q = ListQuerySchema.parse(req.query);

  const conds: string[] = [];
  const params: any[] = [];

  if (q.is_active !== undefined) {
    conds.push("is_active = ?");
    params.push(truthy(q.is_active) ? 1 : 0);
  }

  const { col, dir } = parseOrder(q.order, ["name", "created_at", "updated_at"], "name.asc");
  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";

  const sql = `
    SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
    FROM api_providers
    ${where}
    ORDER BY ${col} ${dir}
  `;

  const [rows] = await mysql.query<ApiProviderDbRow[]>(sql, params);
  return reply.send(rows.map(rowToView));
}

/** GET /admin/api-providers/:id */
export async function adminGetApiProvider(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers
     WHERE id = ? LIMIT 1`,
    [id]
  );

  if (!rows?.length) return reply.code(404).send({ message: "not_found" });
  return reply.send(rowToView(rows[0]));
}

/** POST /admin/api-providers */
export async function adminCreateApiProvider(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const body = CreateBodySchema.parse(req.body); // api_url normalize & validate burada

  // UUID DB'den üret
  const [uuidRows] = await mysql.query<{ id: string }[]>(`SELECT UUID() AS id`);
  const newId = uuidRows[0].id;

  const creds: ApiProviderCredentials = {
    api_url: body.api_url,
    api_key: body.api_key,
    ...(body.credentials ?? {}),
  };

  await mysql.query(
    `INSERT INTO api_providers (id, name, \`type\`, credentials, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [newId, body.name, body.provider_type, JSON.stringify(creds), body.is_active ? 1 : 0]
  );

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers
     WHERE id = ?`,
    [newId]
  );

  return reply.code(201).send(rowToView(rows[0]));
}

/** PUT /admin/api-providers/:id */
export async function adminUpdateApiProvider(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  const patch = UpdateBodySchema.parse(req.body);

  const [existingRows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers
     WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!existingRows?.length) return reply.code(404).send({ message: "not_found" });

  let oldCreds: ApiProviderCredentials = {};
  try { oldCreds = JSON.parse(existingRows[0].credentials) as ApiProviderCredentials; } catch {}

  const overlay: ApiProviderCredentials = {};
  if (patch.api_url !== undefined) overlay.api_url = patch.api_url;
  if (patch.api_key !== undefined) overlay.api_key = patch.api_key;
  if (patch.credentials) Object.assign(overlay, patch.credentials);

  const newCreds =
    Object.keys(overlay).length > 0 ? { ...oldCreds, ...overlay } : undefined;

  const fields: string[] = ["updated_at = NOW()"];
  const params: any[] = [];

  if (patch.name !== undefined)           { fields.push("name = ?");        params.push(patch.name); }
  if (patch.provider_type !== undefined)  { fields.push("`type` = ?");      params.push(patch.provider_type); }
  if (newCreds !== undefined)             { fields.push("credentials = ?"); params.push(JSON.stringify(newCreds)); }
  if (patch.is_active !== undefined)      { fields.push("is_active = ?");   params.push(patch.is_active ? 1 : 0); }

  if (fields.length === 1) return reply.code(400).send({ message: "empty_body" });

  params.push(id);
  await mysql.query(`UPDATE api_providers SET ${fields.join(", ")} WHERE id = ?`, params);

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers
     WHERE id = ?`,
    [id]
  );

  return reply.send(rowToView(rows[0]));
}

/** DELETE /admin/api-providers/:id */
export async function adminDeleteApiProvider(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  await mysql.query(`DELETE FROM api_providers WHERE id = ?`, [id]);
  return reply.code(204).send();
}
