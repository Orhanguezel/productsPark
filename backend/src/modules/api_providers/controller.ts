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

  let rawText = "";
  try {
    let balance: number | null = null;
    let currency: string | null = null;
    let providerError: string | null = null;

    const parseBalanceFromObj = (
      obj: Record<string, unknown> | null
    ): { balance: number | null; currency: string | null } => {
      if (!obj) return { balance: null, currency: null };

      const parseNumLoose = (v: unknown): number | null => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
          const s = v.trim();
          if (!s) return null;
          const direct = Number(s.replace(",", "."));
          if (Number.isFinite(direct)) return direct;
          const m = s.match(/(-?\d+(?:[.,]\d+)?)/);
          if (!m) return null;
          const n = Number(m[1].replace(",", "."));
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };

      const b1 = obj.balance ?? obj.bakiye ?? obj.credit ?? obj.money;
      const b2 = obj.funds;
      const c1 = obj.currency;

      if (b1 !== undefined) {
        const n = parseNumLoose(b1);
        if (n !== null)
          return {
            balance: n,
            currency: typeof c1 === "string" ? c1 : null,
          };
      }
      if (b2 !== undefined) {
        const n = parseNumLoose(b2);
        if (n !== null)
          return {
            balance: n,
            currency: typeof c1 === "string" ? c1 : null,
          };
      }

      for (const k of ["data", "result", "account"]) {
        const data = obj[k];
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const nested = data as Record<string, unknown>;
          const bn =
            nested.balance ?? nested.funds ?? nested.bakiye ?? nested.credit ?? nested.money;
          const cn = nested.currency;
          const n = parseNumLoose(bn);
          if (n !== null) {
            return {
              balance: n,
              currency: typeof cn === "string" ? cn : null,
            };
          }
        }
      }

      return { balance: null, currency: null };
    };

    const parseBalanceFromText = (txt: string): number | null => {
      // Skip HTML responses — they contain random numbers (e.g. height:100%)
      if (txt.trimStart().startsWith('<!') || txt.trimStart().startsWith('<html')) return null;
      const m = txt.match(/(-?\d+(?:[.,]\d+)?)/);
      if (!m) return null;
      const n = Number(m[1].replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };

    const postBody = async (payload: Record<string, string>, asForm = true) => {
      const body = asForm
        ? new URLSearchParams(payload).toString()
        : JSON.stringify(payload);
      const res = await fetchAny(apiUrl, {
        method: "POST",
        headers: asForm
          ? {
              "content-type": "application/x-www-form-urlencoded",
              accept: "application/json, text/plain, */*",
              "user-agent": "Mozilla/5.0 (compatible; ProductSpark/1.0)",
            }
          : {
              "content-type": "application/json",
              accept: "application/json, text/plain, */*",
              "user-agent": "Mozilla/5.0 (compatible; ProductSpark/1.0)",
            },
        body,
      });
      rawText = await res.text();
      let j: Record<string, unknown> | null = null;
      try {
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          j = parsed as Record<string, unknown>;
        }
      } catch {
        j = null;
      }
      return { res, j };
    };

    const tryUserPassBalance = async () => {
      const [username, ...rest] = apiKey.split(":");
      const password = rest.join(":");
      const actions = [
        "balance",
        "get_balance",
        "account_balance",
        "bakiye",
        "user_balance",
        "getBalance",
      ];

      for (const action of actions) {
        for (const asForm of [true, false]) {
          const { j } = await postBody(
            {
              action,
              username: username ?? "",
              user: username ?? "",
              email: username ?? "",
              mail: username ?? "",
              password: password ?? "",
              pass: password ?? "",
              sifre: password ?? "",
              api_key: apiKey,
              format: "json",
            },
            asForm
          );

          if (j?.error && !providerError) {
            providerError = String(j.error).slice(0, 200);
          }

          const p = parseBalanceFromObj(j);
          if (p.balance !== null && !Number.isNaN(p.balance)) {
            balance = p.balance;
            currency = p.currency;
            return;
          }

          const n = parseBalanceFromText(rawText);
          if (n !== null) {
            balance = n;
            return;
          }
        }
      }
    };

    if (row.type === "smm") {
      const { j } = await postBody({
        key: apiKey,
        action: "balance",
        format: "json",
      });

      if (j?.error) {
        providerError = String(j.error).slice(0, 200);
      } else {
        const p = parseBalanceFromObj(j);
        balance = p.balance;
        currency = p.currency;
      }
      // Some providers are saved as "smm" but actually expect user:pass style auth.
      if ((balance === null || Number.isNaN(balance)) && apiKey.includes(":")) {
        await tryUserPassBalance();
      }
    } else if (row.type === "epin" || row.type === "topup") {
      await tryUserPassBalance();
    } else {
      return reply.code(400).send({ message: "unsupported_provider_type" });
    }

    // 2) JSON değilse: ham metinden sayı yakala
    if (balance === null) {
      const n = parseBalanceFromText(rawText);
      if (n !== null) {
        balance = n;
        currency = typeof creds.currency === "string" ? creds.currency : null;
      }
    }

    // 3) hâlâ yoksa: provider cevabı bozuk
    if (balance === null || Number.isNaN(balance)) {
      const rawLower = rawText.toLowerCase();
      const looksLikeHtml =
        rawLower.includes("<!doctype html") || rawLower.includes("<html");
      const isWafPage =
        rawLower.includes("cloudflare") || rawLower.includes("attention required");
      return reply.code(502).send({
        message: isWafPage
          ? "provider_blocked_by_waf"
          : providerError
          ? "provider_error"
          : "bad_provider_response",
        ...(providerError ? { error: providerError } : {}),
        ...(looksLikeHtml && !isWafPage ? { error: "html_response_received" } : {}),
        ...(isWafPage ? { error: "Cloudflare WAF engeli — sunucu IP beyaz listeye alınmalı" } : {}),
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

/** GET /admin/api-providers/:id/services */
export async function adminListApiProviderServices(
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
  const creds = toCredentials(safeParseJson(row.credentials));
  const apiUrl = typeof creds.api_url === "string" ? creds.api_url : "";
  const apiKey = typeof creds.api_key === "string" ? creds.api_key : "";

  if (!apiUrl || !apiKey)
    return reply.code(400).send({ message: "missing_credentials" });
  if (row.type !== "smm")
    return reply.code(400).send({ message: "unsupported_provider_type" });

  const body = new URLSearchParams({
    key: apiKey,
    action: "services",
  }).toString();

  try {
    const res = await fetchAny(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json, text/plain, */*",
      },
      body,
    });

    const rawText = await res.text();
    let json: any;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = null;
    }

    if (!json || (json && !Array.isArray(json) && json.error)) {
      return reply.code(502).send({
        message: "provider_error",
        raw: String(json?.error ?? rawText).slice(0, 300),
      });
    }

    const services = Array.isArray(json) ? json : [];
    return reply.send({ success: true, services });
  } catch (e: any) {
    req.log.error({ err: e }, "list_services_failed");
    return reply.code(502).send({
      message: "provider_unreachable",
      error: e?.message ?? String(e),
    });
  }
}
