import { abs, withQS } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

export function tryBuildProfiles(ctx: BuildUrlCtx): BuiltUrl | null {
  if (ctx.table !== "profiles") return null;
  const pathForNormalize = "/profiles";
  const meUrl = abs("/profiles/v1/me");
  const url = ctx.op === "select" ? withQS(meUrl, { select: ctx.select }) : meUrl;
  return { url, path: pathForNormalize, methodOverride: ctx.op === "update" ? "PUT" : undefined };
}
