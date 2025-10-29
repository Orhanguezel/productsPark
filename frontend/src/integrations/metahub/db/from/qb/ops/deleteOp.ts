// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/deleteOp.ts
// =============================================================
import { buildAuthHeaders } from "../../http";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";

export async function runDelete<TRow>(built: BuiltUrl): Promise<FetchResult<TRow[]>> {
  const headers = buildAuthHeaders();
  const res = await fetch(built.url, { method: "DELETE", credentials: "include", headers });
  if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
  return { data: [] as unknown as TRow[], error: null };
}
