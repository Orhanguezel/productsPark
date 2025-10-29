// =============================================================
// FILE: src/integrations/metahub/db/from/qb/parser.ts
// =============================================================
export function parseBodyToRows(json: unknown): unknown[] | null {
  if (json == null) return null;
  if (Array.isArray(json)) return json as unknown[];
  if (typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as unknown[];
    return [obj]; // tek obje geldiyse diziye çevir
  }
  if (typeof json === "string") {
    try { return parseBodyToRows(JSON.parse(json)); } catch { return null; }
  }
  return null;
}
