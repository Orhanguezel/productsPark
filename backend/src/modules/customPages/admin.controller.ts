// =============================================================
// FILE: src/modules/customPages/admin.controller.ts
// =============================================================
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
import {
  customPageListQuerySchema,
  upsertCustomPageBodySchema,
  patchCustomPageBodySchema,
  type CustomPageListQuery,
  type UpsertCustomPageBody,
  type PatchCustomPageBody,
} from "./validation";

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** LIST (admin) */
export const listPagesAdmin: RouteHandler<{ Querystring: CustomPageListQuery }> = async (req, reply) => {
  const parsed = customPageListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.issues } });
  }
  const q = parsed.data;

  const { items, total } = await listCustomPages({
    orderParam: typeof q.order === "string" ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    is_published: q.is_published,
    q: q.q,
    slug: q.slug,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (admin) */
export const getPageAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCustomPageById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (admin) */
export const getPageBySlugAdmin: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getCustomPageBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** CREATE (admin) */
export const createPageAdmin: RouteHandler<{ Body: UpsertCustomPageBody }> = async (req, reply) => {
  const parsed = upsertCustomPageBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const row = await createCustomPage({
      id: randomUUID(),
      title: b.title.trim(),
      slug: b.slug.trim(),
      content: packContent(b.content), // {"html":"..."}
      meta_title: b.meta_title ?? null,
      meta_description: b.meta_description ?? null,
      is_published: toBool(b.is_published) ? 1 : 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return reply.code(201).send(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "custom_pages_create_failed");
    return reply.code(500).send({ error: { message: "custom_pages_create_failed" } });
  }
};

/** UPDATE (admin, partial) */
export const updatePageAdmin: RouteHandler<{ Params: { id: string }; Body: PatchCustomPageBody }> = async (req, reply) => {
  const parsed = patchCustomPageBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const patched = await updateCustomPage(req.params.id, {
      title: typeof b.title === "string" ? b.title : undefined,
      slug: typeof b.slug === "string" ? b.slug : undefined,
      content: typeof b.content === "string" ? packContent(b.content) : undefined,
      meta_title: b.meta_title ?? null,
      meta_description: b.meta_description ?? null,
      is_published: typeof b.is_published !== "undefined" ? (toBool(b.is_published) ? 1 : 0) : undefined,
    });

    if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(patched);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "custom_pages_update_failed");
    return reply.code(500).send({ error: { message: "custom_pages_update_failed" } });
  }
};

/** DELETE (admin) */
export const removePageAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteCustomPage(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
