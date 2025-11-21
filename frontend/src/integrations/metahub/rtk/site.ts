// =============================================================
// FILE: src/integrations/metahub/rtk/site.ts
// =============================================================
import type { SiteSettingRow, SettingValue, ValueType, UnknownRow } from "./types";

/* ---------------- value parse helpers ---------------- */
const toNum = (x: unknown): number =>
  typeof x === "number" ? x : Number(String(x).replace(",", "."));

const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
};

const tryParseJson = (s: string): SettingValue => {
  try { return JSON.parse(s) as SettingValue; } catch { return s; }
};

export function normalizeSettingValue(
  value: unknown,
  value_type?: ValueType | null
): SettingValue {
  if (value_type === "boolean") return toBool(value);
  if (value_type === "number")  return value == null ? null : toNum(value);
  if (value_type === "json") {
    if (typeof value === "string") return tryParseJson(value);
    if (value && typeof value === "object") return value as SettingValue;
    return null;
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (s === "true" || s === "false" || s === "1" || s === "0" || s === "yes" || s === "no")
      return toBool(s);
    if (!Number.isNaN(Number(s))) return toNum(s);
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]")))
      return tryParseJson(s);
    return s;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value == null) return null;
  return value as SettingValue;
}

/* ---------------- type guards ---------------- */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const pick = <T extends string>(obj: Record<string, unknown>, key: T) =>
  (obj[key] as unknown);

/* ---------------- SELECT normalizer ---------------- */
/** UnknownRow[] + SiteSettingRow[] kabul eder, güvenli dönüştürür. */
export function normalizeSiteSettingRows(
  rows: Array<SiteSettingRow | UnknownRow>
): SiteSettingRow[] {
  return rows.map((r) => {
    const rec = isRecord(r) ? r : ({} as Record<string, unknown>);

    const key = String((rec.key ?? "") as string);
    const group = (rec.group ?? null) as string | null;
    const description = (rec.description ?? null) as string | null;
    const valueType = ((rec.value_type ?? null) as ValueType | null);

    const rawValue = pick(rec, "value");
    const value = normalizeSettingValue(rawValue, valueType);

    // Varsa diğer alanları (id, created_at vb.) koru
    const base = r as SiteSettingRow;
    return {
      ...base,
      key,
      group,
      description,
      value_type: valueType,
      value,
    };
  });
}

/* ---------------- INSERT yardımcıları ---------------- */
export function inferValueType(v: unknown): ValueType {
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number")  return "number";
  if (v && typeof v === "object") return "json";
  return "string";
}

/** FE -> BE: tek satırı insert’e uygun hale getirir */
export function coerceSettingForInsert(row: { key: string; value: unknown }): {
  key: string;
  value: SettingValue;
  value_type: ValueType;
} {
  const key = String(row.key ?? "");
  const value_type = inferValueType(row.value);
  return { key, value: row.value as SettingValue, value_type };
}
