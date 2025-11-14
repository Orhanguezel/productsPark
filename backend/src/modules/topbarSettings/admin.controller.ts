// modules/topbar/admin.controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq, like } from "drizzle-orm";
import { topbarSettings, type NewTopbarRow } from "./schema";
import {
  adminTopbarListQuerySchema,
  adminTopbarCreateSchema,
  adminTopbarUpdateSchema,
  type AdminTopbarListQuery,
  type AdminTopbarCreate,
  type AdminTopbarUpdate,
} from "./validation";

function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}

function mapRowAdmin(r: NewTopbarRow & { created_at?: Date; updated_at?: Date }) {
  return {
    id: r.id,
    text: r.text,
    link: r.link ?? null,
    coupon_id: r.coupon_id ?? null,
    is_active: !!r.is_active,
    show_ticker: !!r.show_ticker,
    created_at:
      (r as any).created_at instanceof Date
        ? (r as any).created_at.toISOString()
        : undefined,
    updated_at:
      (r as any).updated_at instanceof Date
        ? (r as any).updated_at.toISOString()
        : undefined,
  };
}

function resolveOrder(q: AdminTopbarListQuery) {
  const dir = q.order === "desc" ? "desc" : "asc";
  const col =
    q.sort === "updated_at"
      ? topbarSettings.updated_at
      : q.sort === "is_active"
      ? topbarSettings.is_active
      : q.sort === "text"
      ? topbarSettings.text
      : topbarSettings.created_at;
  return { col, dir };
}

/** GET /admin/topbar_settings */
export const adminListTopbar: RouteHandler<{
  Querystring: AdminTopbarListQuery;
}> = async (req, reply) => {
  const q = adminTopbarListQuerySchema.parse(
    req.query ?? {},
  ) as AdminTopbarListQuery;

  const conds: any[] = [];
  if (q.q && q.q.trim()) {
    conds.push(like(topbarSettings.text, `%${q.q.trim()}%`));
  }
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(topbarSettings.is_active, b));
  }

  let qb = db.select().from(topbarSettings).$dynamic();
  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  const { col, dir } = resolveOrder(q);
  qb = qb.orderBy(dir === "desc" ? desc(col) : asc(col));

  if (q.limit && q.limit > 0) qb = qb.limit(q.limit);
  if (q.offset && q.offset >= 0) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows.map(mapRowAdmin));
};

/** GET /admin/topbar_settings/:id */
export const adminGetTopbarById: RouteHandler<{
  Params: { id: string };
}> = async (req, reply) => {
  const { id } = req.params;
  const [row] = await db
    .select()
    .from(topbarSettings)
    .where(eq(topbarSettings.id, id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(mapRowAdmin(row as any));
};

/** POST /admin/topbar_settings */
export const adminCreateTopbar: RouteHandler<{
  Body: AdminTopbarCreate;
}> = async (req, reply) => {
  try {
    const body = adminTopbarCreateSchema.parse(
      req.body ?? {},
    ) as AdminTopbarCreate;

    const id = randomUUID();

    await db.insert(topbarSettings).values({
      id,
      text: body.text,
      link: body.link ?? null,
      coupon_id: body.coupon_id ?? null,
      is_active: toBool(body.is_active) ?? false,
      show_ticker: toBool(body.show_ticker) ?? false,
    } satisfies NewTopbarRow);

    const [row] = await db
      .select()
      .from(topbarSettings)
      .where(eq(topbarSettings.id, id))
      .limit(1);

    return reply.code(201).send(mapRowAdmin(row as any));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** PATCH /admin/topbar_settings/:id */
export const adminUpdateTopbar: RouteHandler<{
  Params: { id: string };
  Body: AdminTopbarUpdate;
}> = async (req, reply) => {
  try {
    const { id } = req.params;
    const patch = adminTopbarUpdateSchema.parse(
      req.body ?? {},
    ) as AdminTopbarUpdate;

    const set: Partial<NewTopbarRow> = {};

    if (patch.text !== undefined) set.text = patch.text;
    if (patch.link !== undefined) set.link = patch.link ?? null;
    if (patch.coupon_id !== undefined)
      set.coupon_id = patch.coupon_id ?? null;
    if (patch.is_active !== undefined)
      set.is_active = toBool(patch.is_active) ?? false;
    if (patch.show_ticker !== undefined)
      set.show_ticker = toBool(patch.show_ticker) ?? false;

    await db.update(topbarSettings).set(set).where(eq(topbarSettings.id, id));

    const [row] = await db
      .select()
      .from(topbarSettings)
      .where(eq(topbarSettings.id, id))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    return reply.send(mapRowAdmin(row as any));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** DELETE /admin/topbar_settings/:id */
export const adminDeleteTopbar: RouteHandler<{
  Params: { id: string };
}> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(topbarSettings).where(eq(topbarSettings.id, id));
  return reply.code(204).send();
};
