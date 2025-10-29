// src/integrations/metahub/db/from/qb/url/blogPosts.ts

import { abs, withQS, /* toAdminPath KULLANMA! */ buildBaseParams } from "./utils";
import type { BuildUrlCtx, BuiltUrl } from "./types";

/** blog_posts write/read: admin route; UPDATE/DELETE PATCH ile (override yok) */
export function tryBuildBlogPosts(ctx: BuildUrlCtx, logicalPath: string): BuiltUrl | null {
  if (logicalPath !== "/blog_posts") return null;

  // ✨ BE gerçeği: /admin/blog_posts  (alt çizgili)
  const adminPath = "/admin/blog_posts";

  if (ctx.op === "insert") {
    return { url: abs(adminPath), path: logicalPath };
  }

  if (ctx.op === "update" || ctx.op === "delete") {
    const idEq = ctx.filters.find(f => f.type === "eq" && f.col === "id");
    if (idEq && typeof idEq.val === "string") {
      return { url: abs(`${adminPath}/${encodeURIComponent(idEq.val)}`), path: logicalPath };
    }
    const { params } = buildBaseParams(ctx);
    return { url: withQS(abs(adminPath), params), path: logicalPath };
  }

  // SELECT normal list: /blog_posts
  const { params } = buildBaseParams(ctx);
  return { url: withQS(abs(logicalPath), params), path: logicalPath };
}
