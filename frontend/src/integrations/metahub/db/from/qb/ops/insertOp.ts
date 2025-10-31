// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/insertOp.ts
// =============================================================
import { buildAuthHeaders, readJson } from "../../http";
import { normalizeTableRows } from "../../../normalizeTables";
import { transformOutgoingPayload } from "../../transforms";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";
import type { UnknownRow } from "../../../types";

/** guards */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const pick = <T extends Record<string, unknown>>(o: T, k: string): string | null => {
  const v = o[k];
  return typeof v === "string" && v ? v : null;
};

async function postOnce(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
}

const looksLikeValidationError = (j: unknown): boolean => {
  if (!isRecord(j)) return false;
  const err = isRecord(j.error) ? (j.error as Record<string, unknown>) : null;
  const msg =
    (err && pick(err, "message")) ||
    pick(j, "message") ||
    pick(j, "error") ||
    pick(j, "detail");
  return typeof msg === "string" && msg.toLowerCase().includes("validation");
};

/** site_settings: value/value_type normalize */
type ValueType = "string" | "number" | "boolean" | "json" | null;
const guessType = (v: unknown): ValueType => {
  if (v === null || v === undefined) return null;
  const t = typeof v;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "json";
};
const toPersist = (v: unknown): string | number | boolean | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
};

function normalizeSiteSettingsPayload(payload: UnknownRow | UnknownRow[]): UnknownRow | UnknownRow[] {
  const arr = Array.isArray(payload) ? payload : [payload];
  const out = arr.map((r) => {
    const rec = r as Record<string, unknown>;
    const key = String(rec.key ?? "");
    const vt = guessType(rec.value);
    const value = toPersist(rec.value);
    const o: Record<string, unknown> = { key, value };
    if (vt) o.value_type = vt;
    return o as UnknownRow;
  });
  return Array.isArray(payload) ? out : out[0];
}

/** helpers for custom_pages */
const isCustomPagesEndpoint = (path: string): boolean =>
  /^\/(custom_pages|admin\/custom_pages)(\/|$)/.test(path);

const toStr = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const normalizeSlug = (s: unknown, fallbackTitle?: unknown): string => {
  const raw = toStr(s) || toStr(fallbackTitle);
  return raw.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
};

const truthy = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** BE'nin beklediği minimal body tipi (referans) */
type CustomPageInsertBody = {
  title: string;
  slug: string;
  content: string;           // STRING: JSON.stringify({ html })
  is_published: boolean;     // boolean
  meta_title?: string;
  meta_description?: string;
  locale?: string;
};

/**
 * custom_pages insert payload normalizer (STRICT):
 * - Sadece BE’nin beklediği alanları gönder
 * - content: **STRING** (JSON.stringify({ html }))
 * - is_published: boolean
 * - meta_title/meta_description/locale: yalnızca doluysa ekle
 * - content_html POST edilmez (strict şemalar reddediyor)
 */
function normalizeCustomPagesPayload(payload: UnknownRow | UnknownRow[]): UnknownRow | UnknownRow[] {
  const arr = Array.isArray(payload) ? payload : [payload];

  const out = arr.map((row) => {
    const rec = (row ?? {}) as Record<string, unknown>;

    const title = toStr(rec.title).trim();
    const slug = normalizeSlug(rec.slug, title);

    // html çıkarımı: content (string/JSON-string/obj) veya content_html (string)
    let html = "";
    const rawContent = rec.content;
    const contentHtmlField = toStr(rec.content_html);

    if (typeof rawContent === "string" && rawContent) {
      try {
        const parsed = JSON.parse(rawContent) as unknown;
        if (isRecord(parsed) && typeof parsed.html === "string") {
          html = parsed.html;
        } else {
          html = rawContent; // düz html string
        }
      } catch {
        html = rawContent;   // parse edilemeyen düz string
      }
    } else if (isRecord(rawContent) && typeof rawContent.html === "string") {
      html = rawContent.html;
    }

    if (!html && contentHtmlField) html = contentHtmlField;

    const body: CustomPageInsertBody = {
      title,
      slug,
      content: JSON.stringify({ html }),
      is_published: typeof rec.is_published === "boolean" ? rec.is_published : truthy(rec.is_published),
    };

    const metaTitle = toStr(rec.meta_title).trim();
    if (metaTitle) body.meta_title = metaTitle;

    const metaDesc = toStr(rec.meta_description).trim();
    if (metaDesc) body.meta_description = metaDesc;

    const loc = rec.locale;
    if (typeof loc === "string" && loc.trim()) body.locale = loc.trim();

    return body as unknown as UnknownRow;
  });

  return Array.isArray(payload) ? out : out[0];
}

/** yalnızca object⇄[object] fallback; wrapper'lar devre dışı */
const isStrictObjectEndpoint = (path: string): boolean =>
  /^\/(orders|admin\/orders|order_items|admin\/order_items|payment_requests|admin\/payment_requests|custom_pages|admin\/custom_pages)(\/|$)/.test(
    path
  );

const isOrdersEndpoint = (path: string): boolean =>
  /^\/(orders|admin\/orders)(\/|$)/.test(path);

/** asıl insert */
export async function runInsert<TRow>(
  built: BuiltUrl,
  rows: UnknownRow | UnknownRow[]
): Promise<FetchResult<TRow[]>> {
  // 0) OUTBOUND DÖNÜŞÜM
  let prepared = transformOutgoingPayload(built.path, rows) as UnknownRow | UnknownRow[];

  // 0.0) /custom_pages → tekil obje
  if (isCustomPagesEndpoint(built.path) && Array.isArray(prepared)) {
    prepared = prepared[0] ?? ({} as UnknownRow);
  }

  // 0.1) /orders → tekil obje
  if (isOrdersEndpoint(built.path) && Array.isArray(prepared)) {
    prepared = prepared[0] ?? ({} as UnknownRow);
  }

  // 0.2) site_settings özel normalize
  const isSiteSettings =
    built.path.includes("/site_settings") || built.url.includes("/site_settings");
  const firstTransformed: UnknownRow | UnknownRow[] = isSiteSettings
    ? normalizeSiteSettingsPayload(prepared)
    : prepared;

  // 0.3) custom_pages özel normalize (STRICT minimal body)
  const firstBody: UnknownRow | UnknownRow[] = isCustomPagesEndpoint(built.path)
    ? normalizeCustomPagesPayload(firstTransformed)
    : firstTransformed;

  // 1) İlk deneme
  let res = await postOnce(built.url, firstBody);

  // 2) Fallback (custom_pages strict: fallback kapalı)
  if (!res.ok) {
    let j: unknown = null;
    try { j = await readJson(res); } catch { /* noop */ }

    if (looksLikeValidationError(j) && !isStrictObjectEndpoint(built.path)) {
      const attempts: unknown[] = [];
      const wasArray = Array.isArray(firstBody);

      if (!wasArray) attempts.push([firstBody]);                 // tekil → dizi
      if (wasArray && (firstBody as unknown[]).length > 0) {
        attempts.push((firstBody as unknown[])[0]);              // dizi → tekil
      }

      for (const alt of attempts) {
        const r = await postOnce(built.url, alt);
        if (r.ok) { res = r; break; }
        res = r; // son hatayı tut
      }
    }
  }

  if (!res.ok) {
    // son hatayı toparla
    let msg = `request_failed_${res.status}`;
    try {
      const last = await readJson(res);
      if (isRecord(last)) {
        const cand =
          pick(last, "message") ||
          (isRecord(last.error) ? pick(last.error as Record<string, unknown>, "message") : null) ||
          pick(last, "error") ||
          pick(last, "detail");
        if (cand) msg = cand;
      }
    } catch { /* noop */ }
    return { data: null, error: { message: msg, status: res.status } };
  }

  // 3) OK → JSON al & normalize et
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }

  let arr: UnknownRow[] = [];
  if (Array.isArray(json)) {
    arr = json as UnknownRow[];
  } else if (isRecord(json)) {
    const maybeData = (json as Record<string, unknown>)["data"];
    if (Array.isArray(maybeData)) {
      arr = maybeData as UnknownRow[];
    } else if (Object.keys(json).length > 0) {
      arr = [json as UnknownRow];
    }
  }

  const data = normalizeTableRows(built.path, arr) as unknown as TRow[];
  return { data, error: null };
}
