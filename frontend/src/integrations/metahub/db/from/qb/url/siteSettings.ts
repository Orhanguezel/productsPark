// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/siteSettings.ts
// =============================================================
import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
const get = (o: unknown, k: string) => (isObj(o) ? o[k] : undefined);
const toStr = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : null);

function pickKeyFromCtx(ctx: BuildUrlCtx): string | null {
  const cands: unknown[] = [
    get(ctx, "key"),
    get(get(ctx, "eq"), "key"),
    get(get(ctx, "where"), "key"),
    get(get(get(ctx, "where"), "eq"), "key"),
    get(get(ctx, "filters"), "key"),
    get(get(get(ctx, "filters"), "eq"), "key"),
    get(get(ctx, "params"), "key"),
  ];
  for (const c of cands) {
    const s = toStr(c);
    if (s) return s;
  }
  return null;
}

/**
 * site_settings:
 * - READ (select) → /site_settings[/:key?]
 * - WRITE (insert/update/delete) → /admin/site_settings[/:key?]
 *   (bulk delete/insert filtre bazlı ise path key'siz kalır, query'de koşullar taşınır)
 */
export function tryBuildSiteSettings(ctx: BuildUrlCtx): BuiltUrl | null {
  if (ctx.table !== "site_settings") return null;

  const isWrite = ctx.op === "insert" || ctx.op === "update" || ctx.op === "delete";
  const base = isWrite ? "/admin/site_settings" : "/site_settings";

  const key = pickKeyFromCtx(ctx);
  const path = key ? `${base}/${encodeURIComponent(key)}` : base;

  const { params } = buildBaseParams(ctx);

  if (key && isObj(params)) {
    delete (params as Record<string, unknown>)["key"];
    delete (params as Record<string, unknown>)["site_settings.key"];
  }

  return { url: withQS(abs(path), params), path };
}
