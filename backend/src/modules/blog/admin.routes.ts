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
// import { requireAdmin } from "@/common/middleware/roles";

export async function registerBlogAdmin(app: FastifyInstance) {
  app.get<{ Querystring: AdminListQuery }>(
    "/admin/blog_posts",
    { preHandler: [requireAuth] }, // istersen: [requireAuth, requireAdmin]
    adminListPosts
  );

  app.get<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminGetPost
  );

  app.post(
    "/admin/blog_posts",
    { preHandler: [requireAuth] },
    adminCreatePost
  );

  app.put<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminUpdatePost
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/blog_posts/:id",
    { preHandler: [requireAuth] },
    adminDeletePost
  );

  app.patch<{ Params: { id: string } }>(
    "/admin/blog_posts/:id/publish",
    { preHandler: [requireAuth] },
    adminTogglePublish
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    "/admin/blog_posts/reorder",
    { preHandler: [requireAuth] },
    adminReorderPosts
  );
}
