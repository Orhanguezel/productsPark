// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/customPages.ts
// =============================================================
import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

/** basit guard */
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function get(o: unknown, k: string): unknown { return isObj(o) ? o[k] : undefined; }
function toId(v: unknown): string | null {
  if (typeof v === "string" && v) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/** ctx’ten id’yi topla (any YOK) */
function pickIdFromCtx(ctx: BuildUrlCtx): string | null {
  const candidates: unknown[] = [
    get(ctx, "id"),
    get(get(ctx, "eq"), "id"),
    get(get(ctx, "eq"), "custom_pages.id"),
    get(get(ctx, "where"), "id"),
    get(get(get(ctx, "where"), "eq"), "id"),
    get(get(ctx, "filters"), "id"),
    get(get(get(ctx, "filters"), "eq"), "id"),
    get(get(ctx, "params"), "id"),
  ];
  for (const c of candidates) {
    const s = toId(c);
    if (s) return s;
  }
  return null;
}

/**
 * custom_pages:
 * - READ (select) → /custom_pages[/:id]
 * - WRITE (insert/update/delete) → /admin/custom_pages[/:id]
 */
export function tryBuildCustomPages(ctx: BuildUrlCtx): BuiltUrl | null {
  if (ctx.table !== "custom_pages") return null;

  const isWrite = ctx.op === "insert" || ctx.op === "update" || ctx.op === "delete";
  const base = isWrite ? "/admin/custom_pages" : "/custom_pages";

  const id = pickIdFromCtx(ctx);
  const path = id ? `${base}/${encodeURIComponent(id)}` : base;

  const { params } = buildBaseParams(ctx);

  // id’yi path’e aldıysak, query’de kalmasın
  if (id && isObj(params)) {
    delete params["id"];
    delete params["custom_pages.id"];
  }

  return { url: withQS(abs(path), params), path: base };
}
