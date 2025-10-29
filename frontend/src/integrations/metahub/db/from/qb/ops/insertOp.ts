// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/insertOp.ts
// =============================================================
import { buildAuthHeaders } from "../../http";
import { normalizeTableRows } from "../../../normalizeTables";
import { parseBodyToRows } from "../parser";
import { transformOutgoingPayload } from "../../transforms";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";
import type { UnknownRow } from "../../../types";

export async function runInsert<TRow>(
  built: BuiltUrl,
  insertPayload: UnknownRow | UnknownRow[] | undefined,
  preferReturn?: "representation" | "minimal"
): Promise<FetchResult<TRow[]>> {
  const headers = buildAuthHeaders({
    "content-type": "application/json",
    "Prefer": `return=${preferReturn ?? "minimal"}`
  });

  // Transform payload for BE
  let bodyPayload: UnknownRow | UnknownRow[] =
    transformOutgoingPayload(built.path, (insertPayload ?? {}) as UnknownRow | UnknownRow[]);

  // /products → tekil obje gönder
  if (built.path === "/products") {
    if (Array.isArray(bodyPayload)) {
      bodyPayload = bodyPayload.length === 1 ? bodyPayload[0] : bodyPayload.map((o) => o)[0] ?? {};
    }
  }

  // İlk deneme
  let res = await fetch(built.url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  // /categories için legacy fallback (mevcut davranışı koru)
  if (!res.ok && built.path === "/categories" && res.status === 400) {
    const original = Array.isArray(bodyPayload) ? bodyPayload[0] : (bodyPayload as Record<string, unknown>);
    const first = { ...original };

    if (first.description == null) first.description = "";
    if (first.is_active == null) first.is_active = true;
    if (first.is_featured == null) first.is_featured = false;
    if (first.display_order == null) first.display_order = 0;
    if (first.image_url == null) delete first.image_url;
    if (first.parent_id == null) delete first.parent_id;

    res = await fetch(built.url, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(first),
    });

    if (!res.ok && res.status === 400) {
      const core = {
        name: String(first.name ?? ""),
        slug: String(first.slug ?? ""),
        description: String(first.description ?? ""),
        is_active: first.is_active === undefined ? true : !!first.is_active,
        ...(first.parent_id === null ? { parent_id: null } : {}),
      };
      res = await fetch(built.url, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(core),
      });
    }
  }

  if (!res.ok) {
    if (res.status === 409) return { data: null, error: { message: "duplicate_slug", status: 409 } };
    return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
  }

  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }
  let data = parseBodyToRows(json) as TRow[] | null;
  if (data) data = normalizeTableRows(built.path, data as unknown as UnknownRow[]) as unknown as TRow[];
  return { data, error: null };
}
