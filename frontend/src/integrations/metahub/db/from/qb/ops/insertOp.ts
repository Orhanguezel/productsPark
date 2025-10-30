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

const pick = (o: Record<string, unknown>, k: string): string | null => {
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
  const err = isRecord(j.error) ? j.error : null;
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

/** yalnızca object⇄[object] fallback; wrapper'lar devre dışı */
const isStrictObjectEndpoint = (path: string): boolean =>
  /^\/(orders|admin\/orders|order_items|admin\/order_items|payment_requests|admin\/payment_requests)(\/|$)/.test(
    path
  );

const isOrdersEndpoint = (path: string): boolean =>
  /^\/(orders|admin\/orders)(\/|$)/.test(path);

/** asıl insert */
export async function runInsert<TRow>(
  built: BuiltUrl,
  rows: UnknownRow | UnknownRow[]
): Promise<FetchResult<TRow[]>> {
  // 0) OUTBOUND DÖNÜŞÜM (kritik!)
  let prepared = transformOutgoingPayload(built.path, rows);

  // 0.1) /orders POST her zaman **tek obje** bekler → array geldiyse ilk öğeyi al
  if (isOrdersEndpoint(built.path) && Array.isArray(prepared)) {
    prepared = prepared[0] ?? {};
  }

  // 0.2) site_settings özel normalize
  const isSiteSettings =
    built.path.includes("/site_settings") || built.url.includes("/site_settings");
  const firstBody = isSiteSettings ? normalizeSiteSettingsPayload(prepared) : prepared;

  // 1) İlk deneme: DÖNÜŞTÜRÜLMÜŞ hâli gönder
  let res = await postOnce(built.url, firstBody);

  // 2) Başarısızsa **yalnızca** object⇄[object] fallback dene
  if (!res.ok) {
    let j: unknown = null;
    try { j = await readJson(res); } catch { /* noop */ }

    if (looksLikeValidationError(j)) {
      const attempts: unknown[] = [];
      const wasArray = Array.isArray(firstBody);

      if (!wasArray) attempts.push([firstBody]);  // tekil → tek elemanlı dizi
      if (wasArray && (firstBody as unknown[]).length > 0) {
        attempts.push((firstBody as unknown[])[0]); // dizi → tekil
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
          (isRecord(last.error) ? pick(last.error, "message") : null) ||
          pick(last, "error") ||
          pick(last, "detail");
        if (cand) msg = cand;
      }
    } catch { /* noop */ }
    return { data: null, error: { message: msg, status: res.status } };
  }

  // OK → JSON al & normalize et
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }

  let arr: UnknownRow[];
  if (Array.isArray(json)) {
    arr = json as UnknownRow[];
  } else if (isRecord(json) && Array.isArray((json ).data)) {
    arr = (json).data as UnknownRow[];
  } else if (isRecord(json) && Object.keys(json).length) {
    arr = [json as UnknownRow];
  } else {
    arr = [];
  }

  const data = normalizeTableRows(built.path, arr) as unknown as TRow[];
  return { data, error: null };
}
