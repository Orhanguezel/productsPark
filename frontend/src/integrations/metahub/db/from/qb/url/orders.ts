import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

export function tryBuildOrders(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/orders") return null;
  const { params, includeFilters } = buildBaseParams(ctx);

  if (includeFilters) {
    const idEq = ctx.filters.find(f => f.type === "eq" && f.col === "id");
    if (idEq && typeof idEq.val === "string" && ctx.op === "select" && (ctx.limit === 1 || !!ctx.range)) {
      const base = abs(`${logicalPath}/${encodeURIComponent(idEq.val)}`);
      return { url: withQS(base, { select: ctx.select }), path: logicalPath };
    }
  }
  const base = abs(logicalPath);
  return { url: withQS(base, params), path: logicalPath };
}
