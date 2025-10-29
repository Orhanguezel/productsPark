// -------------------------------------------------------------
// FILE: src/modules/blog/admin.router.ts
// -------------------------------------------------------------
import type { FastifyInstance } from "fastify";
import {
  adminListPosts,
  adminGetPost,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  adminTogglePublish,
  adminReorderPosts,
} from "./admin.controller";
import type { AdminListQuery } from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";

/**
 * DİKKAT:
 * Burada "/admin/..." path'i veriyorsan, app.ts'de
 * app.register(registerBlogAdmin) (prefix'siz) kaydet.
 * Eğer app.register(registerBlogAdmin, { prefix: "/admin" }) dersen
 * path "/admin/admin/blog_posts" olur.
 */
export async function registerBlogAdmin(app: FastifyInstance) {
  // LIST
  app.get<{ Querystring: AdminListQuery }>(
    "/admin/blog_posts",
    { preHandler: [requireAuth] },
    adminListPosts
  );

  // GET BY ID
  app.get<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminGetPost
  );

  // CREATE
  app.post(
    "/admin/blog_posts",
    { preHandler: [requireAuth] },
    adminCreatePost
  );

  // UPDATE
  app.put<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminUpdatePost
  );

  // DELETE
  app.delete<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminDeletePost
  );

  // TOGGLE PUBLISH
  app.patch<{ Params: { id: string } }>(
    "/admin/blog_posts/:id/publish",
    { preHandler: [requireAuth] },
    adminTogglePublish
  );

  // REORDER
  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    "/admin/blog_posts/reorder",
    { preHandler: [requireAuth] },
    adminReorderPosts
  );
}
