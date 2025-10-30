// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/orderItems.ts
// =============================================================
import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

/** Tip güvenli minimal filter tipleri */
type FilterEq = { type: "eq"; col: string; val: unknown };
type AnyFilter = { type: string; col: string; [k: string]: unknown };

const asFilters = (v: unknown): ReadonlyArray<AnyFilter> =>
  Array.isArray(v) ? (v as ReadonlyArray<AnyFilter>) : [];

export function tryBuildOrderItems(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/order_items") return null;

  const ADMIN_ORDER_BASE = "/admin/orders";
  const ADMIN_ITEMS_BASE = "/admin/order_items";

  // ---------- READ: /admin/orders/:id/items ----------
  if (ctx.op === "select") {
    const orderEq = asFilters((ctx as unknown as { filters?: unknown }).filters)
      .find((f): f is FilterEq => f.type === "eq" && f.col === "order_id");

    if (orderEq && typeof orderEq.val === "string" && orderEq.val) {
      // BE bu endpoint’te select/qs beklemiyor → sade URL
      const url = abs(`${ADMIN_ORDER_BASE}/${encodeURIComponent(orderEq.val)}/items`);
      return { url, path: logicalPath };
    }

    // Diğer SELECT senaryosu: /admin/order_items?...
    const { params } = buildBaseParams(ctx);
    return { url: withQS(abs(ADMIN_ITEMS_BASE), params), path: logicalPath };
  }

  // ---------- WRITE: /admin/order_items[/id] ----------
  const idEq = asFilters((ctx as unknown as { filters?: unknown }).filters)
    .find((f): f is FilterEq => f.type === "eq" && f.col === "id");

  if (idEq && typeof idEq.val === "string" && idEq.val) {
    return { url: abs(`${ADMIN_ITEMS_BASE}/${encodeURIComponent(idEq.val)}`), path: logicalPath };
  }

  const { params } = buildBaseParams(ctx);
  return { url: withQS(abs(ADMIN_ITEMS_BASE), params), path: logicalPath };
}
