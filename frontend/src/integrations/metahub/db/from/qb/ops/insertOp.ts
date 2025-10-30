// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/insertOp.ts
// =============================================================
import { buildAuthHeaders, readJson } from "../../http";
import { normalizeTableRows } from "../../../normalizeTables";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";
import type { UnknownRow } from "../../../types";

/** guards & helpers (no any) */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const pickString = (obj: Record<string, unknown>, key: string): string | null => {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v : null;
};

const looksLikeValidationError = (j: unknown): boolean => {
  if (!isRecord(j)) return false;
  const errObj = isRecord(j.error) ? j.error : null;
  const msg = (errObj && pickString(errObj, "message")) || pickString(j, "message");
  return typeof msg === "string" && msg.toLowerCase().includes("validation");
};

async function postOnce(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
}

/** site_settings için value + value_type normalize et */
type ValueType = "string" | "number" | "boolean" | "json" | null;
const guessType = (v: unknown): ValueType => {
  if (v === null || v === undefined) return null;
  const t = typeof v;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "json";
};
const toPersistable = (v: unknown): string | number | boolean | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
};

function normalizeSiteSettingsPayload(payload: UnknownRow[]): UnknownRow[] {
  return payload.map((r) => {
    const key = String(r.key ?? "");
    const valueRaw = (r as Record<string, unknown>).value;
    const vt = guessType(valueRaw);
    const value = toPersistable(valueRaw);
    const out: Record<string, unknown> = { key, value };
    if (vt) out.value_type = vt;
    return out as UnknownRow;
  });
}

/** Toplu istek başarısız olursa tek tek deneyip ilk hatayı detayla döndür */
async function tryInsertIndividually(
  url: string,
  items: UnknownRow[],
  allowArrayEnvelope: boolean
): Promise<{ ok: boolean; res?: Response; errMsg?: string }> {
  for (let i = 0; i < items.length; i++) {
    const rec = items[i];
    // 1) tekil obje dene
    let r = await postOnce(url, rec);
    if (!r.ok) {
      // 2) bazı backend’ler tek elemanlı dizi ister
      if (allowArrayEnvelope) {
        r = await postOnce(url, [rec]);
      }
    }
    if (!r.ok) {
      let msg = `validation_error_at_${i}`;
      try {
        const j = await readJson(r);
        if (isRecord(j)) {
          const cand =
            pickString(j, "message") ??
            (isRecord(j.error) ? pickString(j.error, "message") : null) ??
            pickString(j, "error") ??
            pickString(j, "detail");
          if (cand) msg = `${msg}:${cand}`;
        }
      } catch { /* noop */ }
      // hata aldık → dur ve bildir
      return { ok: false, res: r, errMsg: msg };
    }
  }
  return { ok: true };
}

export async function runInsert<TRow>(
  built: BuiltUrl,
  rows: UnknownRow | UnknownRow[]
): Promise<FetchResult<TRow[]>> {
  const given = Array.isArray(rows) ? rows : [rows];

  // site_settings özel normalizasyonu (value_type + JSON stringify)
  const isSiteSettings =
    built.path.includes("/site_settings") || built.url.includes("/site_settings");
  const payload = isSiteSettings ? normalizeSiteSettingsPayload(given) : given;

  // 1) İlk deneme: ham dizi
  let res = await postOnce(built.url, payload);

  if (!res.ok) {
    let msg = `request_failed_${res.status}`;
    let j: unknown = null;
    try { j = await readJson(res); } catch { /* noop */ }

    // 2) "validation" görünüyorsa wrapper denemeleri
    if (j && looksLikeValidationError(j)) {
      const wrappers: ReadonlyArray<Record<string, unknown>> = [
        { settings: payload },
        { records:  payload },
        { items:    payload },
        { data:     payload },
      ];

      for (const w of wrappers) {
        const retry = await postOnce(built.url, w);
        if (retry.ok) { res = retry; break; }

        let jj: unknown = null;
        try { jj = await readJson(retry); } catch { /* noop */ }

        // 3) Hâlâ validation ise tek tek dene (tekil obje / tek elemanlı dizi)
        if (jj && looksLikeValidationError(jj)) {
          const indiv = await tryInsertIndividually(
            built.url,
            payload,
            /* allowArrayEnvelope */ true
          );
          if (indiv.ok) {
            // tek tek başarılı → “boş ama ok” dön (çıktıyı normalleyecek veri yoksa)
            return { data: [] as unknown as TRow[], error: null };
          }
          // tek tekte de hata → bunu kullan
          res = indiv.res ?? retry;
          j = jj ?? j;
          break;
        } else {
          // farklı hata → kır
          res = retry;
          j = jj ?? j;
          break;
        }
      }
    }

    if (!res.ok) {
      // son hatayı mesajlaştır
      try {
        const last = j ?? (await readJson(res));
        if (isRecord(last)) {
          const cand =
            pickString(last, "message") ??
            (isRecord(last.error) ? pickString(last.error, "message") : null) ??
            pickString(last, "error") ??
            pickString(last, "detail");
          if (cand) msg = cand;
        }
      } catch { /* noop */ }
      return { data: null, error: { message: msg, status: res.status } };
    }
  }

  // OK → JSON yükle ve normalize et
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }

  let data = (Array.isArray(json) ? json : null) as TRow[] | null;
  if (data) {
    data = normalizeTableRows(built.path, data as unknown as UnknownRow[]) as unknown as TRow[];
  }
  return { data, error: null };
}
