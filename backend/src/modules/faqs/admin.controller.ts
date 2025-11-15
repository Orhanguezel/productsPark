// src/modules/faqs/admin.controller.ts

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listFaqs,
  getFaqById,
  getFaqBySlug,
  createFaq,
  updateFaq,
  deleteFaq,
} from "./repository";
import {
  faqListQuerySchema,
  upsertFaqBodySchema,
  patchFaqBodySchema,
  type FaqListQuery,
  type UpsertFaqBody,
  type PatchFaqBody,
} from "./validation";

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** LIST (admin) */
export const listFaqsAdmin: RouteHandler<{ Querystring: FaqListQuery }> = async (req, reply) => {
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
    is_active: q.is_active, // 0/1/string gelse de repository boolean'a çeviriyor
    q: q.q,
    slug: q.slug,
    category: q.category,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (admin) */
export const getFaqAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getFaqById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (admin) */
export const getFaqBySlugAdmin: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getFaqBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** CREATE (admin) */
export const createFaqAdmin: RouteHandler<{ Body: UpsertFaqBody }> = async (req, reply) => {
  const parsed = upsertFaqBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const row = await createFaq({
      id: randomUUID(),
      question: b.question.trim(),
      answer: b.answer, // düz metin/HTML
      slug: b.slug.trim(),
      category: typeof b.category === "string" ? b.category.trim() : b.category ?? null,
      is_active: typeof b.is_active === "undefined" ? true : toBool(b.is_active), // 👈 boolean
      display_order: typeof b.display_order === "number" ? b.display_order : 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return reply.code(201).send(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "faqs_create_failed");
    return reply.code(500).send({ error: { message: "faqs_create_failed" } });
  }
};

/** UPDATE (admin, partial) */
export const updateFaqAdmin: RouteHandler<{ Params: { id: string }; Body: PatchFaqBody }> = async (req, reply) => {
  const parsed = patchFaqBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const patched = await updateFaq(req.params.id, {
      question: typeof b.question === "string" ? b.question.trim() : undefined,
      answer: typeof b.answer === "string" ? b.answer : undefined,
      slug: typeof b.slug === "string" ? b.slug.trim() : undefined,
      category: typeof b.category !== "undefined" ? (b.category ?? null) : undefined,
      is_active: typeof b.is_active !== "undefined" ? toBool(b.is_active) : undefined, // 👈 boolean
      display_order: typeof b.display_order === "number" ? b.display_order : undefined,
    });

    if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(patched);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "faqs_update_failed");
    return reply.code(500).send({ error: { message: "faqs_update_failed" } });
  }
};

/** DELETE (admin) */
export const removeFaqAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteFaq(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};

