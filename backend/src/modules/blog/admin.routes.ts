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

const BASE_PATH = "/blog_posts";

export async function registerBlogAdmin(app: FastifyInstance) {
  app.get<{ Querystring: AdminListQuery }>(
    BASE_PATH,
    { preHandler: [requireAuth] }, // istersen: [requireAuth, requireAdmin]
    adminListPosts
  );

  app.get<{ Params: { id: string } }>(
    `${BASE_PATH}/:id`,
    { preHandler: [requireAuth] },
    adminGetPost
  );

  app.post(
    BASE_PATH,
    { preHandler: [requireAuth] },
    adminCreatePost
  );

  app.put<{ Params: { id: string } }>(
    `${BASE_PATH}/:id`,
    { preHandler: [requireAuth] },
    adminUpdatePost
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE_PATH}/:id`,
    { preHandler: [requireAuth] },
    adminDeletePost
  );

  app.patch<{ Params: { id: string } }>(
    `${BASE_PATH}/:id/publish`,
    { preHandler: [requireAuth] },
    adminTogglePublish
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    `${BASE_PATH}/reorder`,
    { preHandler: [requireAuth] },
    adminReorderPosts
  );
}
