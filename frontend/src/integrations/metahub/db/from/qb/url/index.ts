// =============================================================
// FILE: src/integrations/metahub/db/from/qb/url/index.ts
// =============================================================
import { logicalPathOf, buildBaseParams } from "./utils";
import { tryBuildProfiles } from "./profiles";
import { tryBuildOrders } from "./orders";
import { tryBuildOrderItems } from "./orderItems";
import { tryBuildProducts } from "./products";
import { tryBuildBlogPosts } from "./blogPosts";
import { tryBuildCustomPages } from "./customPages";
import { tryBuildSiteSettings } from "./siteSettings";
import { tryBuildPaymentRequests } from "./paymentRequests";
import { tryBuildRestful } from "./restful";
import { abs, withQS } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

export function buildUrl(ctx: BuildUrlCtx): BuiltUrl | null {
  const logicalPath = logicalPathOf(ctx.table);
  if (!logicalPath) return null;

  const prof = tryBuildProfiles(ctx);            if (prof) return prof;
  const ord  = tryBuildOrders(ctx, logicalPath); if (ord)  return ord;
  const ordItems = tryBuildOrderItems(ctx, logicalPath);if (ordItems) return ordItems;
  const prod = tryBuildProducts(ctx, logicalPath); if (prod) return prod;
  const blog = tryBuildBlogPosts(ctx, logicalPath); if (blog) return blog;
  const settings = tryBuildSiteSettings(ctx);    if (settings) return settings;
  const payReq = tryBuildPaymentRequests(ctx, logicalPath); if (payReq) return payReq;
  const cpages = tryBuildCustomPages(ctx);       if (cpages)  return cpages;

  const generic = tryBuildRestful(ctx, logicalPath);
  if (generic) return generic;

  const { params } = buildBaseParams(ctx);
  return { url: withQS(abs(logicalPath), params), path: logicalPath };
}

export type { BuildUrlCtx, BuiltUrl } from "./types";
