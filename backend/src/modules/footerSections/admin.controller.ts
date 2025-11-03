// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/admin.controller.ts
// ----------------------------------------------------------------------
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { footerSections } from "./schema";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import {
  adminFooterSectionListQuerySchema,
  adminFooterSectionCreateSchema,
  adminFooterSectionUpdateSchema,
  adminFooterSectionReorderSchema,
  type AdminFooterSectionListQuery,
  type AdminFooterSectionCreate,
  type AdminFooterSectionUpdate,
  type AdminFooterSectionReorder,
} from "./validation";

/** Map DB -> Admin FE */
function mapRowAdmin(r: typeof footerSections.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    links: r.links, // JSON string
    display_order: r.order_num,
    is_active: r.is_active,
    created_at: r.created_at?.toISOString?.(),
    updated_at: r.updated_at?.toISOString?.(),
  };
}

/** Sıralama çözümleyici */
function resolveOrder(q: AdminFooterSectionListQuery) {
  const dir = q.order === "desc" ? "desc" : "asc";
  const col =
    q.sort === "created_at"
      ? footerSections.created_at
      : q.sort === "title"
      ? footerSections.title
      : footerSections.order_num; // default display_order
  return { col, dir };
}

/** GET /admin/footer_sections */
export const adminListFooterSections: RouteHandler<{ Querystring: AdminFooterSectionListQuery }> = async (req, reply) => {
  const q = adminFooterSectionListQuerySchema.parse(req.query ?? {}) as AdminFooterSectionListQuery;

  const conds: any[] = [];
  if (q.q && q.q.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(like(footerSections.title, s));
  }
  if (typeof q.is_active === "boolean") {
    conds.push(eq(footerSections.is_active, q.is_active));
  }
  const whereExpr = conds.length ? (conds.length === 1 ? conds[0] : and(...conds)) : undefined;

  // total
  let totalQ = db.select({ total: sql<number>`COUNT(*)` }).from(footerSections).$dynamic();
  if (whereExpr) totalQ = totalQ.where(whereExpr);
  const [{ total }] = await totalQ;

  // data
  const { col, dir } = resolveOrder(q);
  const lim = q.limit && q.limit > 0 ? q.limit : undefined;
  const off = q.offset && q.offset >= 0 ? q.offset : undefined;

  let qb = db.select().from(footerSections).$dynamic();
  if (whereExpr) qb = qb.where(whereExpr);
  qb = qb.orderBy(dir === "desc" ? desc(col) : asc(col));
  if (lim) qb = qb.limit(lim);
  if (off !== undefined) qb = qb.offset(off);

  const rows = await qb;

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows.map(mapRowAdmin));
};

/** GET /admin/footer_sections/:id */
export const adminGetFooterSectionById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  const rows = await db.select().from(footerSections).where(eq(footerSections.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRowAdmin(rows[0]));
};

/** POST /admin/footer_sections */
export const adminCreateFooterSection: RouteHandler<{ Body: AdminFooterSectionCreate }> = async (req, reply) => {
  try {
    const body = adminFooterSectionCreateSchema.parse(req.body ?? {}) as AdminFooterSectionCreate;
    const id = randomUUID();

    await db.insert(footerSections).values({
      id,
      title: body.title,
      links: body.links ?? "[]",
      order_num: body.display_order ?? 0,
      is_active: body.is_active ?? true,
    });

    const [row] = await db.select().from(footerSections).where(eq(footerSections.id, id)).limit(1);
    return reply.code(201).send(mapRowAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** PATCH /admin/footer_sections/:id */
export const adminUpdateFooterSection: RouteHandler<{ Params: { id: string }; Body: AdminFooterSectionUpdate }> = async (req, reply) => {
  try {
    const { id } = req.params;
    const patch = adminFooterSectionUpdateSchema.parse(req.body ?? {}) as AdminFooterSectionUpdate;

    const set: Partial<typeof footerSections.$inferInsert> = { updated_at: new Date() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.links !== undefined) set.links = patch.links ?? "[]";
    if (patch.display_order !== undefined) set.order_num = patch.display_order;
    if (patch.is_active !== undefined) set.is_active = patch.is_active;

    await db.update(footerSections).set(set).where(eq(footerSections.id, id));

    const [row] = await db.select().from(footerSections).where(eq(footerSections.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(mapRowAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** DELETE /admin/footer_sections/:id */
export const adminDeleteFooterSection: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(footerSections).where(eq(footerSections.id, id));
  return reply.code(204).send();
};

/** POST /admin/footer_sections/reorder */
export const adminReorderFooterSections: RouteHandler<{ Body: AdminFooterSectionReorder }> = async (req, reply) => {
  const { items } = adminFooterSectionReorderSchema.parse(req.body ?? {});
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const it of items) {
      await tx
        .update(footerSections)
        .set({ order_num: it.display_order, updated_at: now })
        .where(eq(footerSections.id, it.id));
    }
  });

  return reply.send({ ok: true });
};
