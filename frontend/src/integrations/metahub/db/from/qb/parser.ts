// =============================================================
// FILE: src/integrations/metahub/db/from/qb/parser.ts
// =============================================================
import type { UnknownRow } from "../../types";

export function parseBodyToRows(json: unknown): UnknownRow[] | null {
  if (Array.isArray(json)) return json as UnknownRow[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    const payload = (Object.prototype.hasOwnProperty.call(obj, "data") ? obj["data"] : json) as unknown;
    if (Array.isArray(payload)) return payload as UnknownRow[];
    if (payload && typeof payload === "object") return [payload as UnknownRow];
    return null;
  }
  return null;
}
