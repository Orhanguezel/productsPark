// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/paymentRequests.ts
// =============================================================
import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

/** Tip güvenli minimal filter tipleri */
type FilterEq = { type: "eq"; col: string; val: unknown };
type AnyFilter = { type: string; col: string; [k: string]: unknown };
const asFilters = (v: unknown): ReadonlyArray<AnyFilter> =>
  Array.isArray(v) ? (v as ReadonlyArray<AnyFilter>) : [];

/** SELECT içindeki `orders(` varsa include=order ipucunu üret */
function inferIncludeFromSelect(sel?: string | null): string | undefined {
  if (!sel || typeof sel !== "string") return undefined;
  // basit sezgisel
  if (sel.includes("orders")) return "order,items";
  return undefined;
}

export function tryBuildPaymentRequests(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/payment_requests") return null;

  const ADMIN_BASE = "/admin/payment_requests";

  // ---------- WRITE (INSERT/UPDATE/DELETE → HER ZAMAN ADMIN) ----------
  if (ctx.op !== "select") {
    const idEq = asFilters((ctx as unknown as { filters?: unknown }).filters)
      .find((f): f is FilterEq => f.type === "eq" && f.col === "id");

    if (idEq && typeof idEq.val === "string") {
      return { url: abs(`${ADMIN_BASE}/${encodeURIComponent(idEq.val)}`), path: logicalPath };
    }
    const { params } = buildBaseParams(ctx);
    return { url: withQS(abs(ADMIN_BASE), params), path: logicalPath };
  }

  // ---------- READ (LIST/DETAIL) ----------
  const idEq = asFilters((ctx as unknown as { filters?: unknown }).filters)
    .find((f): f is FilterEq => f.type === "eq" && f.col === "id");

  if (idEq && typeof idEq.val === "string") {
    const base = abs(`${ADMIN_BASE}/${encodeURIComponent(idEq.val)}`);
    return { url: withQS(base, {}), path: logicalPath };
  }

  const { params } = buildBaseParams(ctx);
  // FE .select(...) Supabase tarzını BE kullanmıyorsa, minimal bir include ipucu geç
  const include = inferIncludeFromSelect(ctx.select);
  if (include) (params as Record<string, unknown>).include = include;

  // BE çoğunlukla order=asc|desc bekler
  if (typeof (params as Record<string, unknown>).order === "string") {
    const piece = String((params as Record<string, unknown>).order).split(".").pop()!;
    (params as Record<string, unknown>).order = piece === "asc" || piece === "desc" ? piece : "desc";
  }

  return { url: withQS(abs(ADMIN_BASE), params), path: logicalPath };
}
