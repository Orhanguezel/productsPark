import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listCustomPages,
  getCustomPageById,
  getCustomPageBySlug,
  createCustomPage,
  updateCustomPage,
  deleteCustomPage,
  packContent,
} from "./repository";

type ListQuery = {
  order?: string;
  sort?: "created_at" | "updated_at";
  orderDir?: "asc" | "desc";
  limit?: string;
  offset?: string;
  is_published?: "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
  select?: string;
};

export const listPages: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
  try {
    const { select: _select, ...q } = req.query ?? {};
    const limitNum  = q.limit  ? Number(q.limit)  : undefined;
    const offsetNum = q.offset ? Number(q.offset) : undefined;

    const { items, total } = await listCustomPages({
      orderParam: typeof q.order === "string" ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: Number.isFinite(limitNum as number) ? (limitNum as number) : undefined,
      offset: Number.isFinite(offsetNum as number) ? (offsetNum as number) : undefined,
      is_published: q.is_published,
      q: q.q,
      slug: q.slug,
    });

    reply.header("x-total-count", String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    req.log.error({ err }, "custom_pages_list_failed");
    return reply.code(500).send({ error: { message: "custom_pages_list_failed" } });
  }
};

/** GET BY ID */
export const getPage: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCustomPageById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getPageBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getCustomPageBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** CREATE (public — istersen kapat) */
type CreateBody = {
  title: string;
  slug?: string;
  content_html: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;

  // Görsel alanları
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;
};

export const createPage: RouteHandler<{ Body: CreateBody }> = async (req, reply) => {
  const b = req.body;
  if (!b?.title || !b?.content_html) {
    return reply.code(400).send({ error: { message: "missing_required_fields" } });
    }

  const row = await createCustomPage({
    id: randomUUID(),
    title: b.title,
    slug: (b.slug && b.slug.trim()) || b.title.trim().toLowerCase().replace(/\s+/g, "-"),
    content: packContent(b.content_html),

    featured_image: b.featured_image ?? null,
    featured_image_asset_id: b.featured_image_asset_id ?? null,
    featured_image_alt: b.featured_image_alt ?? null,

    meta_title: typeof b.meta_title !== "undefined" ? b.meta_title : undefined,
    meta_description: typeof b.meta_description !== "undefined" ? b.meta_description : undefined,

    is_published: b.is_published ? 1 : 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row);
};

/** UPDATE (patch) */
type PatchBody = Partial<CreateBody>;

export const updatePage: RouteHandler<{ Params: { id: string }; Body: PatchBody }> = async (req, reply) => {
  const b = req.body ?? {};
  const patched = await updateCustomPage(req.params.id, {
    title: b.title,
    slug: b.slug,
    content: typeof b.content_html === "string" ? packContent(b.content_html) : undefined,

    featured_image: typeof b.featured_image !== "undefined" ? (b.featured_image ?? null) : undefined,
    featured_image_asset_id:
      typeof b.featured_image_asset_id !== "undefined" ? (b.featured_image_asset_id ?? null) : undefined,
    featured_image_alt:
      typeof b.featured_image_alt !== "undefined" ? (b.featured_image_alt ?? null) : undefined,

    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published: typeof b.is_published === "boolean" ? (b.is_published ? 1 : 0) : undefined,
  });

  if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(patched);
};

/** DELETE */
export const removePage: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteCustomPage(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
