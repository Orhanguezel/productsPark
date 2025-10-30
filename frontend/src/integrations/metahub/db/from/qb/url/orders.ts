// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/orders.ts
// =============================================================
import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

function isAdminLocation(): boolean {
  if (typeof window === "undefined") return false;
  return /^\/admin(?:\/|$)/.test(window.location.pathname);
}

type FilterEq = { type: "eq"; col: string; val: unknown };
type FilterInVal = { type: "in"; col: string; val: unknown[] };
type FilterInVals = { type: "in"; col: string; vals: unknown[] };
type OtherFilter = { type: string; col: string; [k: string]: unknown };
type AnyFilter = FilterEq | FilterInVal | FilterInVals | OtherFilter;

const asFilters = (v: unknown): ReadonlyArray<AnyFilter> =>
  Array.isArray(v) ? (v as ReadonlyArray<AnyFilter>) : [];

/** payment_status: "completed" → paid|refunded|partially_refunded */
function patchOrdersFilters(ctx: BuildUrlCtx): BuildUrlCtx {
  const original = asFilters((ctx as unknown as { filters?: unknown }).filters);
  if (!original.length) return ctx;

  const patched = original.map((f) => {
    if (f.type === "in" && f.col === "payment_status") {
      const raw =
        "val" in f && Array.isArray((f as FilterInVal).val)
          ? (f as FilterInVal).val
          : "vals" in f && Array.isArray((f as FilterInVals).vals)
          ? (f as FilterInVals).vals
          : [];
      const s = new Set<string>(raw.map(String));
      if (s.has("completed")) {
        s.delete("completed");
        s.add("paid"); s.add("refunded"); s.add("partially_refunded");
      }
      const arr = Array.from(s);
      if ("val" in f)  return { ...f, val:  arr } as AnyFilter;
      if ("vals" in f) return { ...f, vals: arr } as AnyFilter;
    }
    return f;
  });

  return { ...ctx, filters: patched as unknown as BuildUrlCtx["filters"] };
}

function normalizeAdminOrderParam(params: Record<string, unknown>): void {
  const raw = params.order;
  if (typeof raw !== "string") return;
  const piece = raw.split(".").pop() || raw;
  params.order = piece === "asc" || piece === "desc" ? piece : "desc";
}

export function tryBuildOrders(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/orders") return null;

  const PUBLIC_BASE = "/orders";
  const ADMIN_BASE  = "/admin/orders";

  // ---------- WRITE (INSERT/UPDATE/DELETE) ----------
  if (ctx.op !== "select") {
    // Public sayfada → PUBLIC_BASE, admin’de → ADMIN_BASE
    const baseForWrite = isAdminLocation() ? ADMIN_BASE : PUBLIC_BASE;

    const idEq = asFilters((ctx as unknown as { filters?: unknown }).filters)
      .find((f): f is FilterEq => f.type === "eq" && f.col === "id");

    // Base params al ama POST/PUT/PATCH/DELETE için select/order gibi query’leri at
    const { params } = buildBaseParams(ctx);
    if ("select" in params) delete (params as Record<string, unknown>).select;
    if ("order"  in params) delete (params as Record<string, unknown>).order;
    if ("limit"  in params) delete (params as Record<string, unknown>).limit;
    if ("offset" in params) delete (params as Record<string, unknown>).offset;

    if (idEq && typeof idEq.val === "string") {
      const u = abs(`${baseForWrite}/${encodeURIComponent(idEq.val)}`);
      return { url: withQS(u, params), path: logicalPath };
    }
    return { url: withQS(abs(baseForWrite), params), path: logicalPath };
  }

  // ---------- READ ----------
  const preferAdminForRead = isAdminLocation();
  const basePath = preferAdminForRead ? ADMIN_BASE : PUBLIC_BASE;

  const patchedCtx = patchOrdersFilters(ctx);
  const { params } = buildBaseParams(patchedCtx);

  // BE Zod clamp (≤200)
  if (typeof params.limit === "number") {
    params.limit = Math.max(1, Math.min(200, Number(params.limit)));
  }

  // admin listede sadece asc|desc bekleniyor
  if (basePath === ADMIN_BASE) normalizeAdminOrderParam(params as Record<string, unknown>);

  // eq(id) → /:id
  const idEq = asFilters(patchedCtx.filters)
    .find((f): f is FilterEq => f.type === "eq" && f.col === "id");
  if (idEq && typeof idEq.val === "string") {
    const base = abs(`${basePath}/${encodeURIComponent(idEq.val)}`);
    return { url: withQS(base, { select: ctx.select }), path: logicalPath };
  }

  // Liste
  const base = abs(basePath);
  const qs: Record<string, unknown> = { ...params };
  if (ctx.select) qs.select = ctx.select;
  return { url: withQS(base, qs), path: logicalPath };
}
