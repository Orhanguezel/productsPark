// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/controller.ts
// ----------------------------------------------------------------------
import type { RouteHandler } from "fastify";
import {
  listFooterSections,
  getFooterSectionById,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
} from "./repository";
import {
  footerSectionListQuerySchema,
  footerSectionCreateSchema,
  footerSectionUpdateSchema,
  type FooterSectionListQuery,
  type FooterSectionCreateInput,
  type FooterSectionUpdateInput,
} from "./validation";
import { randomUUID } from "crypto";

/** Liste */
export const listController: RouteHandler<{ Querystring: FooterSectionListQuery }> = async (req, reply) => {
  const q = footerSectionListQuerySchema.parse(req.query ?? {}) as FooterSectionListQuery;

  const { items, total } = await listFooterSections({
    q: q.q,
    is_active: q.is_active,
    limit: q.limit,
    offset: q.offset,
    order: q.order,
  });

  const mapped = items.map((r) => ({
    id: r.id,
    title: r.title,
    links: r.links,
    display_order: r.order_num,
    is_active: r.is_active,
    created_at: r.created_at?.toISOString?.(),
    updated_at: r.updated_at?.toISOString?.(),
  }));

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(mapped);
};

/** Get by id */
export const getController: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getFooterSectionById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({
    id: row.id,
    title: row.title,
    links: row.links,
    display_order: row.order_num,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString?.(),
    updated_at: row.updated_at?.toISOString?.(),
  });
};

/** Create (public’te kapatmak istersen router’da bağlama) */
export const createController: RouteHandler<{ Body: FooterSectionCreateInput }> = async (req, reply) => {
  const body = footerSectionCreateSchema.parse(req.body ?? {}) as FooterSectionCreateInput;

  const id = randomUUID();
  const row = await createFooterSection({
    id,
    title: body.title,
    links: body.links, // JSON string
    order_num: body.order_num,
    is_active: body.is_active ?? true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(
    row
      ? {
          id: row.id,
          title: row.title,
          links: row.links,
          display_order: row.order_num,
          is_active: row.is_active,
          created_at: row.created_at?.toISOString?.(),
          updated_at: row.updated_at?.toISOString?.(),
        }
      : row
  );
};

/** Update */
export const updateController: RouteHandler<{ Params: { id: string }; Body: FooterSectionUpdateInput }> = async (req, reply) => {
  const patch = footerSectionUpdateSchema.parse(req.body ?? {}) as FooterSectionUpdateInput;

  const row = await updateFooterSection(req.params.id, {
    title: patch.title,
    links: patch.links,
    order_num: patch.order_num,
    is_active: patch.is_active,
  });

  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({
    id: row.id,
    title: row.title,
    links: row.links,
    display_order: row.order_num,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString?.(),
    updated_at: row.updated_at?.toISOString?.(),
  });
};

/** Delete */
export const deleteController: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteFooterSection(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
