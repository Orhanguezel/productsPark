// src/modules/faqs/controller.ts
import type { RouteHandler } from "fastify";
import { listFaqs, getFaqById, getFaqBySlug } from "./repository";
import { faqListQuerySchema, type FaqListQuery } from "./validation";

/** LIST (public) */
export const listFaqsPublic: RouteHandler<{ Querystring: FaqListQuery }> = async (req, reply) => {
  const parsed = faqListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.issues } });
  }
  const q = parsed.data;

  const { items, total } = await listFaqs({
    orderParam: typeof q.order === "string" ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    q: q.q,
    slug: q.slug,
    category: q.category,
    is_active: true, // 👈 public: zorunlu
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (public) */
export const getFaqPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getFaqById(req.params.id);
  if (!row || !row.is_active) { // 👈 boolean kontrol
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getFaqBySlugPublic: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getFaqBySlug(req.params.slug);
  if (!row || !row.is_active) { // 👈 boolean kontrol
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(row);
};
