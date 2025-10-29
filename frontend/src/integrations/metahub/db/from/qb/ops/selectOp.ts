// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/selectOp.ts
// =============================================================
import { getHeadersForSelect } from "../headers";
import { normalizeTableRows } from "../../../normalizeTables";
import { readCountFromHeaders } from "../../http";
import { parseBodyToRows } from "../parser";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";
import type { UnknownRow } from "../../../types";

export async function runSelect<TRow>(
  built: BuiltUrl,
  selectOpts: { count?: "exact" | "planned" | "estimated"; head?: boolean }
): Promise<FetchResult<TRow[]>> {
  const res = await fetch(built.url, { credentials: "include", headers: getHeadersForSelect(selectOpts) });
  if (res.status === 404) return { data: [] as unknown as TRow[], error: null, count: 0 };
  if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

  const count = readCountFromHeaders(res);
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }
  let data = parseBodyToRows(json) as TRow[] | null;
  if (data) data = normalizeTableRows(built.path, data as unknown as UnknownRow[]) as unknown as TRow[];
  return { data, error: null, count };
}
