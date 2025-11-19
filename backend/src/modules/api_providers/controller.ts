// =============================================================
// FILE: src/modules/api_providers/controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ListQuerySchema,
  IdParamSchema,
  CreateBodySchema,
  UpdateBodySchema,
} from "./validation";
import type { ApiProviderView, ApiProviderCredentials } from "./schema";

// Node 18+ global fetch yoksa fallback
import _fetch from "node-fetch";
const fetchAny: typeof fetch = (globalThis as any).fetch || (_fetch as any);

/** MySQL minimal yüzey */
type MySQL = { query<T = any[]>(sql: string, params?: any[]): Promise<[T, any]> };

function getMysql(req: FastifyRequest): MySQL {
  const s = req.server as any;
  const r = req as any;
  const db = s.mysql ?? r.mysql ?? s.db ?? s.mariadb ?? null;
  if (!db?.query)
    throw new Error(
      "MySQL pool not found. Make sure fastify.mysql is registered."
    );
  return db as MySQL;
}

const truthy = (v: unknown) =>
  v === true || v === "true" || v === 1 || v === "1";
const toIso = (v: unknown) =>
  v instanceof Date ? v.toISOString() : String(v ?? "");

function parseOrder(raw: string | undefined, allow: string[], fallback = "name.asc") {
  if (!raw) raw = fallback;
  const s = raw.toLowerCase().trim();
  if (s === "asc" || s === "desc")
    return {
      col: fallback.split(".")[0],
      dir: s === "desc" ? "DESC" : "ASC",
    };
  const [maybeCol, maybeDir] = s.split(".");
  const col = allow.includes(maybeCol) ? maybeCol : fallback.split(".")[0];
  const dir = maybeDir === "desc" ? "DESC" : "ASC";
  return { col, dir };
}

type ApiProviderDbRow = {
  id: string;
  name: string;
  type: string;
  credentials: string; // JSON string (LONGTEXT)
  is_active: 0 | 1;
  created_at: string | Date;
  updated_at: string | Date;
};

/* ---------------- helpers: credentials temizleme/sanitize ---------------- */

function safeParseJson<T = unknown>(s: unknown): T | {} {
  try {
    if (typeof s !== "string") return (s ?? {}) as T;
    return s ? (JSON.parse(s) as T) : {};
  } catch {
    return {};
  }
}

/** objeden null/undefined'ları at */
function cleanObject<T extends Record<string, unknown>>(
  obj?: T
): Partial<T> | undefined {
  if (!obj) return undefined;
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== null && v !== undefined
  );
  return entries.length
    ? (Object.fromEntries(entries) as Partial<T>)
    : undefined;
}

/** raw → ApiProviderCredentials tipine güvenli daraltma */
function toCredentials(raw: any): ApiProviderCredentials {
  const out: ApiProviderCredentials = {};
  if (typeof raw?.api_url === "string") out.api_url = raw.api_url;
  if (typeof raw?.api_key === "string") out.api_key = raw.api_key;
  if (typeof raw?.balance === "number") out.balance = raw.balance;
  if (typeof raw?.currency === "string") out.currency = raw.currency;
  if (typeof raw?.last_balance_check === "string")
    out.last_balance_check = raw.last_balance_check;
  // kalan alanları da (tipini bozmayacak şekilde) merge edelim
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (!(k in out)) out[k] = v as unknown;
    }
  }
  return out;
}

/** mevcut creds ile overlay'i birleştir (null/undefined yok say) */
function mergeCreds(
  base: ApiProviderCredentials,
  overlay?: Record<string, unknown>
): ApiProviderCredentials {
  const cleaned = cleanObject(overlay) ?? {};
  const next: ApiProviderCredentials = { ...base };
  for (const [k, v] of Object.entries(cleaned)) {
    // currency alanına null yazmayacağız; sadece string ise yaz
    if (k === "currency") {
      if (typeof v === "string") next.currency = v;
      continue;
    }
    (next as any)[k] = v;
  }
  return next;
}

/* ---------------- row → view ---------------- */

function rowToView(row: ApiProviderDbRow): ApiProviderView {
  const raw = safeParseJson(row.credentials);
  const creds = toCredentials(raw);

  return {
    id: row.id,
    name: row.name,
    provider_type: row.type,
    api_url: typeof creds.api_url === "string" ? creds.api_url : null,
    api_key: typeof creds.api_key === "string" ? creds.api_key : null,
    is_active: row.is_active === 1,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    credentials: creds,
    balance:
      typeof (raw as any).balance === "number"
        ? (raw as any).balance
        : null,
    currency:
      typeof (raw as any).currency === "string"
        ? (raw as any).currency
        : null,
    last_balance_check:
      typeof (raw as any).last_balance_check === "string"
        ? (raw as any).last_balance_check
        : null,
  };
}

/* ---------------- HANDLERS ---------------- */

/** GET /admin/api-providers */
export async function adminListApiProviders(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const q = ListQuerySchema.parse(req.query);

  const conds: string[] = [];
  const params: any[] = [];

  if (q.is_active !== undefined) {
    conds.push("is_active = ?");
    params.push(truthy(q.is_active) ? 1 : 0);
  }

  const { col, dir } = parseOrder(
    q.order,
    ["name", "created_at", "updated_at"],
    "name.asc"
  );
  const where = conds.length ? ` WHERE ${conds.join(" AND ")}` : "";
  const sqlStr = `
    SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
    FROM api_providers
    ${where}
    ORDER BY ${col} ${dir}
  `;

  const [rows] = await mysql.query<ApiProviderDbRow[]>(sqlStr, params);
  return reply.send(rows.map(rowToView));
}

/** GET /admin/api-providers/:id */
export async function adminGetApiProvider(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows?.length) return reply.code(404).send({ message: "not_found" });
  return reply.send(rowToView(rows[0]));
}

/** POST /admin/api-providers */
export async function adminCreateApiProvider(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const body = CreateBodySchema.parse(req.body);

  const [uuidRows] = await mysql.query<{ id: string }[]>(`SELECT UUID() AS id`);
  const newId = uuidRows[0].id;

  const base: ApiProviderCredentials = {
    api_url: body.api_url,
    api_key: body.api_key,
  };
  const creds = mergeCreds(base, body.credentials);

  await mysql.query(
    `INSERT INTO api_providers (id, name, \`type\`, credentials, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(3))`,
    [newId, body.name, body.provider_type, JSON.stringify(creds), body.is_active ? 1 : 0]
  );

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers WHERE id = ?`,
    [newId]
  );

  return reply.code(201).send(rowToView(rows[0]));
}

/** PUT /admin/api-providers/:id */
export async function adminUpdateApiProvider(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  const patch = UpdateBodySchema.parse(req.body);

  const [existingRows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!existingRows?.length)
    return reply.code(404).send({ message: "not_found" });

  const oldRaw = safeParseJson(existingRows[0].credentials);
  const oldCreds = toCredentials(oldRaw);

  let overlay: Record<string, unknown> = {};
  if (patch.api_url !== undefined) overlay.api_url = patch.api_url;
  if (patch.api_key !== undefined) overlay.api_key = patch.api_key;
  if (patch.credentials) overlay = { ...overlay, ...patch.credentials };

  const newCredsObj = cleanObject(overlay);
  const newCreds =
    newCredsObj && Object.keys(newCredsObj).length > 0
      ? mergeCreds(oldCreds, newCredsObj)
      : undefined;

  const fields: string[] = ["updated_at = NOW(3)"];
  const params: any[] = [];

  if (patch.name !== undefined) {
    fields.push("name = ?");
    params.push(patch.name);
  }
  if (patch.provider_type !== undefined) {
    fields.push("`type` = ?");
    params.push(patch.provider_type);
  }
  if (newCreds !== undefined) {
    fields.push("credentials = ?");
    params.push(JSON.stringify(newCreds));
  }
  if (patch.is_active !== undefined) {
    fields.push("is_active = ?");
    params.push(patch.is_active ? 1 : 0);
  }

  if (fields.length === 1)
    return reply.code(400).send({ message: "empty_body" });

  params.push(id);
  await mysql.query(
    `UPDATE api_providers SET ${fields.join(", ")} WHERE id = ?`,
    params
  );

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers WHERE id = ?`,
    [id]
  );

  return reply.send(rowToView(rows[0]));
}

/** DELETE /admin/api-providers/:id */
export async function adminDeleteApiProvider(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);
  await mysql.query(`DELETE FROM api_providers WHERE id = ?`, [id]);
  return reply.code(204).send();
}

/** POST /admin/api-providers/:id/check-balance */
export async function adminCheckApiProviderBalance(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const mysql = getMysql(req);
  const { id } = IdParamSchema.parse(req.params);

  const [rows] = await mysql.query<ApiProviderDbRow[]>(
    `SELECT id, name, \`type\`, credentials, is_active, created_at, updated_at
     FROM api_providers WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows?.length) return reply.code(404).send({ message: "not_found" });

  const row = rows[0];
  const raw = safeParseJson(row.credentials);
  const creds = toCredentials(raw);

  const apiUrl = typeof creds.api_url === "string" ? creds.api_url : "";
  const apiKey = typeof creds.api_key === "string" ? creds.api_key : "";

  if (!apiUrl || !apiKey)
    return reply.code(400).send({ message: "missing_credentials" });
  if (row.type !== "smm")
    return reply.code(400).send({ message: "unsupported_provider_type" });

  const body = new URLSearchParams({
    key: apiKey,
    action: "balance",
    format: "json",
  }).toString();

  let rawText = "";
  try {
    const res = await fetchAny(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json, text/plain, */*",
      },
      body,
    });

    rawText = await res.text();

    // 1) JSON parse dene
    let j: any;
    try {
      j = JSON.parse(rawText);
    } catch {
      j = null;
    }

    let balance: number | null = null;
    let currency: string | null = null;

    if (j && typeof j === "object") {
      if (j.error) {
        // Örn: key hatalı vs.
        return reply.code(502).send({
          message: "provider_error",
          raw: String(j.error).slice(0, 200),
        });
      }
      if (j.balance !== undefined) {
        balance = Number(j.balance);
        currency = typeof j.currency === "string" ? j.currency : null;
      } else if (j.funds !== undefined) {
        balance = Number(j.funds);
        currency = typeof j.currency === "string" ? j.currency : null;
      }
    }

    // 2) JSON değilse: ham metinden sayı yakala
    if (balance === null) {
      const m = rawText.match(/(-?\d+(?:[.,]\d+)?)/);
      if (m) {
        balance = Number(m[1].replace(",", "."));
        currency = typeof creds.currency === "string" ? creds.currency : null;
      }
    }

    // 3) hâlâ yoksa: provider cevabı bozuk
    if (balance === null || Number.isNaN(balance)) {
      return reply.code(502).send({
        message: "bad_provider_response",
        raw: rawText.slice(0, 300),
      });
    }

    const nowIso = new Date().toISOString();

    const resolvedCurrency =
      typeof currency === "string"
        ? currency
        : typeof creds.currency === "string"
        ? creds.currency
        : undefined;

    const merged = mergeCreds(creds, {
      balance,
      last_balance_check: nowIso,
      ...(resolvedCurrency ? { currency: resolvedCurrency } : {}),
    });

    await mysql.query(
      `UPDATE api_providers SET credentials = ?, updated_at = NOW(3) WHERE id = ?`,
      [JSON.stringify(merged), id]
    );

    return reply.send({
      success: true,
      balance,
      currency: resolvedCurrency ?? null,
      last_balance_check: nowIso,
    });
  } catch (e: any) {
    req.log.error(
      { err: e, raw: rawText.slice(0, 160) },
      "balance_check_failed"
    );
    return reply.code(502).send({
      message: "provider_unreachable",
      error: e?.message ?? String(e),
    });
  }
}
