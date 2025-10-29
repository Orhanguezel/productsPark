import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

export function tryBuildProducts(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/products") return null;

  // INSERT → /admin/products
  if (ctx.op === "insert") {
    return { url: abs("/admin/products"), path: logicalPath };
  }

  // UPDATE/DELETE → /admin/products/:id veya /admin/products?...
  if (ctx.op === "update" || ctx.op === "delete") {
    const idEq = ctx.filters.find(f => f.type === "eq" && f.col === "id");
    if (idEq && typeof idEq.val === "string") {
      return { url: abs(`/admin/products/${encodeURIComponent(idEq.val)}`), path: logicalPath };
    }
    const { params } = buildBaseParams(ctx);
    return { url: withQS(abs("/admin/products"), params), path: logicalPath };
  }

  // SELECT normal
  const { params } = buildBaseParams(ctx);
  return { url: withQS(abs(logicalPath), params), path: logicalPath };
}
