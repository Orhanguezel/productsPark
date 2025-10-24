import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listFooterSections,
  getFooterSectionById,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
} from "./repository";
import { footerSectionCreateSchema, footerSectionUpdateSchema } from "./validation";

/** Liste */
type ListQuery = {
  q?: string;
  limit?: string;
  offset?: string;
  order?: "asc" | "desc";
};

export const listController: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
  const q = req.query;
  const limitNum = q.limit ? Number(q.limit) : undefined;
  const offsetNum = q.offset ? Number(q.offset) : undefined;

  const { items, total } = await listFooterSections({
    q: q.q,
    limit: Number.isFinite(limitNum!) ? limitNum : undefined,
    offset: Number.isFinite(offsetNum!) ? offsetNum : undefined,
    order: q.order,
  });

  // FE uyumu için: display_order alias’ını ekliyoruz (order_num’dan)
  const mapped = items.map((r) => ({
    ...r,
    display_order: r.order_num,
  }));

  reply.header("x-total-count", String(total));
  return reply.send(mapped);
};

/** Get by id */
export const getController: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getFooterSectionById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  // display_order alias
  return reply.send({ ...row, display_order: row.order_num });
};

/** Create */
type CreateBody = {
  title: string;
  links: string | Array<{ label: string; href: string; external?: boolean }>;
  order_num?: number | string;
};

export const createController: RouteHandler<{ Body: CreateBody }> = async (req, reply) => {
  const parsed = footerSectionCreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "validation_error", details: parsed.error.issues } });
  }

  const id = randomUUID();
  const row = await createFooterSection({
    id,
    title: parsed.data.title,
    links: parsed.data.links,        // string (JSON) halde
    order_num: parsed.data.order_num,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row ? { ...row, display_order: row.order_num } : row);
};

/** Update */
type PatchBody = Partial<CreateBody>;

export const updateController: RouteHandler<{ Params: { id: string }; Body: PatchBody }> = async (req, reply) => {
  const parsed = footerSectionUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "validation_error", details: parsed.error.issues } });
  }

  const row = await updateFooterSection(req.params.id, {
    title: parsed.data.title,
    links: parsed.data.links,              // string (JSON) halde
    order_num: parsed.data.order_num,
  });

  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ ...row, display_order: row.order_num });
};

/** Delete */
export const deleteController: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteFooterSection(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
