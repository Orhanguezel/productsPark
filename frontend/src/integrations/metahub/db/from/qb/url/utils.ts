// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/utils.ts
// =============================================================
import { BASE_URL } from "../../../../rtk/constants";
import { joinUrl, toQS } from "../../http";
import { TABLES } from "../../../tables";
import type { KnownTables } from "../../../types";
import type { BuildUrlCtx } from "./types";

export const logicalPathOf = (table: string): string | null =>
  TABLES[table as KnownTables] ?? null;

/**
 * Admin yolu üretir.
 * ÖNEMLİ: Alt çizgileri KORU. (BE: /admin/blog_posts, /admin/product_reviews ...)
 */
export const toAdminPath = (logicalPath: string) => {
  const p = logicalPath.startsWith("/") ? logicalPath : `/${logicalPath}`;
  return `/admin${p}`; // hiçbir replace yok
};

export function buildBaseParams(ctx: BuildUrlCtx) {
  const { op, select, preferReturn, filters, order, limit, range } = ctx;
  const params: Record<string, unknown> = {};

  const wantSelectParam = op === "select" || preferReturn === "representation";
  if (wantSelectParam) params.select = select;

  const includeFilters = op === "select" || op === "update" || op === "delete";
  if (includeFilters) {
    for (const f of filters) {
      if (f.type === "eq") params[f.col] = f.val;
      if (f.type === "neq") params[`${f.col}!`] = f.val;
      if (f.type === "in") {
        params[`${f.col}_in`] = (Array.isArray(f.val) ? f.val : [])
          .map(String)
          .join(",");
      }
    }
  }

  if (op === "select") {
    if (order)
      params.order =
        order.ascending === false ? `${order.col}.desc` : `${order.col}.asc`;
    if (limit != null) params.limit = limit;
    if (range) {
      params.offset = range[0];
      params.limit = range[1] - range[0] + 1;
    }
  }

  return { params, includeFilters };
}

/** BASE_URL ile mutlak URL (path başında / yoksa ekler) */
export const abs = (p: string) => {
  const path = p.startsWith("/") ? p : `/${p}`;
  return joinUrl(BASE_URL, path);
};

export const withQS = (base: string, params: Record<string, unknown>) => {
  const qs = toQS(params);
  return qs ? `${base}?${qs}` : base;
};
