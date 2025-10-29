// src/integrations/metahub/db/from/qb/url/restful.ts

import { abs, withQS, buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

export function tryBuildRestful(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  const { params, includeFilters } = buildBaseParams(ctx);

  // UPDATE/DELETE → RESTful /:id (id varsa)
  if ((ctx.op === "update" || ctx.op === "delete") && includeFilters) {
    const idEq = ctx.filters.find(f => f.type === "eq" && f.col === "id");
    if (idEq && typeof idEq.val === "string") {
      return { url: abs(`${logicalPath}/${encodeURIComponent(idEq.val)}`), path: logicalPath };
    }
  }

  const base = abs(logicalPath);
  return { url: withQS(base, params), path: logicalPath };
}
