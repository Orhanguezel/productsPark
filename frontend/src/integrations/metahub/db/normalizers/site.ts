// =============================================================
// FILE: src/integrations/metahub/db/normalizers/site.ts
// =============================================================
import type { SiteSettingRow, SettingValue, ValueType } from "../types";

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
  // Heuristik: "true/false", numeric str, JSON str
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

export function normalizeSiteSettingRows(rows: SiteSettingRow[]): SiteSettingRow[] {
  return rows.map((r) => ({
    ...r,
    key: String(r.key ?? ""),
    group: r.group ?? null,
    description: r.description ?? null,
    value_type: (r.value_type ?? null) as ValueType | null,
    value: normalizeSettingValue(r.value, r.value_type ?? null),
  }));
}
