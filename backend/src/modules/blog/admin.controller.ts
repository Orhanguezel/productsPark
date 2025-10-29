// -------------------------------------------------------------
// FILE: src/modules/blog/admin.controller.ts
// -------------------------------------------------------------
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostById,
} from "./repository";
import { blogCreateSchema, blogUpdateSchema } from "./validation";

// ——— helpers ———
const to01 = (v: unknown): 0 | 1 => {
  if (v === true || v === 1 || v === "1" || v === "true") return 1;
  return 0;
};
const nowIf = (cond: boolean): Date | null => (cond ? new Date() : null);
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ——— admin list query tipi (public ile uyumlu) ———
export type AdminListQuery = {
  order?: string; // "created_at.desc"
  sort?: "created_at" | "updated_at" | "published_at";
  orderDir?: "asc" | "desc";
  limit?: string;
  offset?: string;
  is_published?: "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
};

// ========================
// LIST (GET /admin/blog_posts)
// ========================
export const adminListPosts: RouteHandler<{ Querystring: AdminListQuery }> = async (
  req,
  reply
) => {
    const q = req.query;

    const limitNum = q.limit ? Number(q.limit) : undefined;
    const offsetNum = q.offset ? Number(q.offset) : undefined;
    const safeLimit = Number.isFinite(limitNum!) ? limitNum : undefined;
    const safeOffset = Number.isFinite(offsetNum!) ? offsetNum : undefined;

    const { items, total } = await listBlogPosts({
      orderParam: typeof q.order === "string" ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: safeLimit,
      offset: safeOffset,
      is_published: q.is_published,
      q: q.q,
      slug: q.slug,
    });

    reply.header("x-total-count", String(total));
    return reply.send(items);
};

// ========================
// GET BY ID (GET /admin/blog_posts/:id)
// ========================
export const adminGetPost: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply
) => {
  const row = await getBlogPostById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

// ——— schemas (admin only) ———
const publishToggleSchema = z.object({
  is_published: z.coerce.boolean(),
});

// ========================
// CREATE (POST /admin/blog_posts)
// ========================
export const adminCreatePost: RouteHandler = async (req, reply) => {
  try {
    const parsed = blogCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: "invalid_body", detail: parsed.error.flatten() },
      });
    }

    const b = parsed.data;
    const slug = (b.slug && b.slug.trim()) || slugify(b.title);
    const isPublished = !!b.is_published;

    const row = await createBlogPost({
      id: randomUUID(),
      title: b.title,
      slug,
      excerpt: b.excerpt ?? null,
      content: b.content,
      featured_image: b.featured_image ?? null,
      author: b.author ?? null,
      meta_title: b.meta_title ?? null,
      meta_description: b.meta_description ?? null,
      is_published: to01(isPublished),
      published_at: b.published_at ?? (isPublished ? new Date() : null),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "duplicate_slug" } });
    }
    req.log.error(e, "adminCreatePost_failed");
    return reply.code(500).send({ error: { message: "db_error" } });
  }
};

// =========================
// UPDATE (PUT /admin/blog_posts/:id)
// =========================
export const adminUpdatePost: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply
) => {
  try {
    const parsed = blogUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: "invalid_body", detail: parsed.error.flatten() },
      });
    }

    const patchIn = parsed.data;

    const slug =
      patchIn.slug?.trim() ??
      (patchIn.title ? slugify(patchIn.title) : undefined);

    // publish/unpublish mantığı
    let published_at: Date | null | undefined = patchIn.published_at ?? undefined;
    if (patchIn.is_published === true && patchIn.published_at === undefined) {
      published_at = nowIf(true);
    }
    if (patchIn.is_published === false && patchIn.published_at === undefined) {
      published_at = null;
    }

    const updated = await updateBlogPost(req.params.id, {
      title: patchIn.title,
      slug,
      excerpt: patchIn.excerpt ?? null,
      content: patchIn.content,
      featured_image:
        patchIn.featured_image === undefined
          ? undefined
          : patchIn.featured_image ?? null,
      author: patchIn.author ?? null,
      meta_title: patchIn.meta_title ?? null,
      meta_description: patchIn.meta_description ?? null,
      is_published:
        patchIn.is_published === undefined ? undefined : to01(patchIn.is_published),
      published_at,
      updated_at: new Date(),
    });

    if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(updated);
  } catch (e: any) {
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "duplicate_slug" } });
    }
    req.log.error(e, "adminUpdatePost_failed");
    return reply.code(500).send({ error: { message: "db_error" } });
  }
};

// =====================================
// TOGGLE PUBLISH (PATCH /admin/blog_posts/:id/publish)
// =====================================
export const adminTogglePublish: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply
) => {
  try {
    const parsed = publishToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: "invalid_body", detail: parsed.error.flatten() },
      });
    }

    const is_published = parsed.data.is_published;
    const patched = await updateBlogPost(req.params.id, {
      is_published: to01(is_published),
      published_at: is_published ? new Date() : null,
      updated_at: new Date(),
    });

    if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(patched);
  } catch (e) {
    (req as any).log?.error(e, "adminTogglePublish_failed");
    return reply.code(500).send({ error: { message: "db_error" } });
  }
};

// ============================
// DELETE (DELETE /admin/blog_posts/:id)
// ============================
export const adminDeletePost: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply
) => {
  try {
    const exists = await getBlogPostById(req.params.id);
    if (!exists) return reply.code(404).send({ error: { message: "not_found" } });

    await deleteBlogPost(req.params.id);
    return reply.code(204).send();
  } catch (e) {
    (req as any).log?.error(e, "adminDeletePost_failed");
    return reply.code(500).send({ error: { message: "db_error" } });
  }
};

// ========================================
// REORDER (POST /admin/blog_posts/reorder)
// ========================================
const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      display_order: z.number().int(),
    })
  ),
});

export const adminReorderPosts: RouteHandler = async (req, reply) => {
  try {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: "invalid_body", detail: parsed.error.flatten() },
      });
    }

    // Şu an display_order kolonu yok → NO-OP
    return reply.send({ ok: true });
  } catch (e) {
    (req as any).log?.error(e, "adminReorderPosts_failed");
    return reply.code(500).send({ error: { message: "db_error" } });
  }
};
