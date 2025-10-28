// src/modules/blog/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "./repository";

/** FE ile uyumlu ve tipli query parametreleri */
type ListQuery = {
  /** Supabase-benzeri: "created_at.desc" */
  order?: string;
  /** Alternatif: sadece güvenli alanlar */
  sort?: "created_at" | "updated_at" | "published_at";
  orderDir?: "asc" | "desc";
  limit?: string;
  offset?: string;
  is_published?: "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
};

export const listPosts: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
  const q = req.query;

  const limitNum = q.limit ? Number(q.limit) : undefined;
  const offsetNum = q.offset ? Number(q.offset) : undefined;

  const safeLimit = typeof limitNum === "number" && Number.isFinite(limitNum) ? limitNum : undefined;
  const safeOffset = typeof offsetNum === "number" && Number.isFinite(offsetNum) ? offsetNum : undefined;

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

export const getPost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getBlogPostById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const getPostBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getBlogPostBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

type CreateBody = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;
  author?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  published_at?: string | null;
};

export const createPost: RouteHandler<{ Body: CreateBody }> = async (req, reply) => {
  const b = req.body;
  if (!b?.title || !b?.content) {
    return reply.code(400).send({ error: { message: "missing_required_fields" } });
  }

  const rawSlug =
    (b.slug && b.slug.trim()) ||
    b.title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const parsedDate = b.published_at ? new Date(b.published_at) : null;

  const row = await createBlogPost({
    id: randomUUID(),
    title: b.title,
    slug: rawSlug,
    excerpt: b.excerpt ?? null,
    content: b.content,
    featured_image: b.featured_image ?? null,
    author: b.author ?? null,
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published: b.is_published ? 1 : 0,
    published_at: parsedDate,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row);
};

type PatchBody = Partial<CreateBody>;

export const updatePost: RouteHandler<{ Params: { id: string }; Body: PatchBody }> = async (req, reply) => {
  const b = req.body ?? {};
  const patched = await updateBlogPost(req.params.id, {
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt ?? null,
    content: b.content,
    featured_image: b.featured_image === undefined ? undefined : (b.featured_image ?? null),
    author: b.author ?? null,
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published: typeof b.is_published === "boolean" ? (b.is_published ? 1 : 0) : undefined,
    published_at:
      b.published_at === undefined
        ? undefined
        : (b.published_at ? new Date(b.published_at) : null),
  });

  if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(patched);
};

export const deletePost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteBlogPost(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
