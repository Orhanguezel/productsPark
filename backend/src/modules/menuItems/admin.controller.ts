import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq, isNull, like, inArray, sql } from "drizzle-orm";
import { menuItems } from "./schema";
import {
  adminMenuItemListQuerySchema,
  adminMenuItemCreateSchema,
  adminMenuItemUpdateSchema,
  adminMenuItemReorderSchema,
  type AdminMenuItemListQuery,
  type AdminMenuItemCreate,
  type AdminMenuItemUpdate,
} from "./validation";

/** helpers */
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}
const toIntMaybe = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** DB -> Admin FE map (tam) */
function mapRowToAdmin(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    title: r.label,
    url: r.url ?? null,
    type: (r.type ?? 'custom') as 'page' | 'custom',
    page_id: r.page_id ?? null,
    parent_id: r.parent_id ?? null,
    location: (r.location ?? 'header') as 'header' | 'footer',
    icon: r.icon ?? null,
    section_id: r.section_id ?? null,
    is_active: !!r.is_active,
    display_order: r.order_num ?? 0,
    created_at: r.created_at?.toISOString?.(),
    updated_at: r.updated_at?.toISOString?.(),
  };
}

/** sıralama */
function resolveOrder(q: AdminMenuItemListQuery) {
  const dir = q.order === "desc" ? "desc" : "asc";
  const col =
    q.sort === "created_at"
      ? menuItems.created_at
      : q.sort === "title"
      ? menuItems.label
      : menuItems.order_num;
  return { col, dir };
}

/** GET /admin/menu_items */
export const adminListMenuItems: RouteHandler = async (req, reply) => {
  const q = adminMenuItemListQuerySchema.parse(req.query ?? {});
  const conds: any[] = [];

  if (q.q?.trim()) conds.push(like(menuItems.label, `%${q.q.trim()}%`));
  if (q.parent_id !== undefined) conds.push(q.parent_id === null ? isNull(menuItems.parent_id) : eq(menuItems.parent_id, q.parent_id));
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(menuItems.is_active, b));
  }
  if (q.location) conds.push(eq(menuItems.location, q.location as any));
  if (q.section_id !== undefined) conds.push(q.section_id === null ? isNull(menuItems.section_id) : eq(menuItems.section_id, q.section_id));


  const whereExpr = conds.length ? (conds.length === 1 ? conds[0] : and(...conds)) : undefined;

  // total
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(menuItems)
    .where(whereExpr as any);

  // data
  const { col, dir } = resolveOrder(q);
  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);

  let qb = db.select().from(menuItems).$dynamic();
  if (whereExpr) qb = qb.where(whereExpr as any);
  qb = qb.orderBy(dir === "desc" ? desc(col) : asc(col));
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows.map(mapRowToAdmin));
};

/** GET /admin/menu_items/:id */
export const adminGetMenuItemById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRowToAdmin(rows[0]));
};

/** POST /admin/menu_items */
export const adminCreateMenuItem: RouteHandler = async (req, reply) => {
  try {
    const body = adminMenuItemCreateSchema.parse(req.body ?? {});
    const id = randomUUID();

    await db.insert(menuItems).values({
      id,
      label: body.title,
      url: body.url ?? '',
      parent_id: body.parent_id ?? null,
      order_num: body.display_order ?? 0,
      is_active: toBool(body.is_active) ?? true,

      // NEW
      location: body.location, // 'header' | 'footer'
      section_id: body.location === 'footer' ? (body.section_id ?? null) : null,
      type: body.type ?? 'custom',
      page_id: body.type === 'page' ? (body.page_id ?? null) : null,
      icon: body.icon ?? null,
    });

    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    return reply.code(201).send(mapRowToAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** PATCH /admin/menu_items/:id */
export const adminUpdateMenuItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const patch = adminMenuItemUpdateSchema.parse(req.body ?? {});

    const set: Partial<typeof menuItems.$inferInsert> = {};
    if (patch.title !== undefined) set.label = patch.title;
    if (patch.url !== undefined) set.url = patch.url ?? '';
    if (patch.display_order !== undefined) set.order_num = patch.display_order;
    if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active) ?? true;

    // NEW: location / section
    if (patch.location !== undefined) set.location = patch.location;
    if (patch.section_id !== undefined) {
      set.section_id = (patch.location ?? set.location ?? 'header') === 'footer'
        ? (patch.section_id ?? null)
        : null;
    }

    // NEW: type / page_id / icon
    if (patch.type !== undefined) set.type = patch.type;
    if (patch.page_id !== undefined) set.page_id = patch.type === 'page' ? (patch.page_id ?? null) : null;
    if (patch.icon !== undefined) set.icon = patch.icon ?? null;

    // parent kontrolü (aynen kalsın)
    if (patch.parent_id !== undefined) {
      if (patch.parent_id === id) return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
      if (patch.parent_id) {
        const [exists] = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.id, patch.parent_id)).limit(1);
        if (!exists) return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
        set.parent_id = patch.parent_id;
      } else set.parent_id = null;
    }

    await db.update(menuItems).set(set).where(eq(menuItems.id, id));

    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(mapRowToAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** DELETE /admin/menu_items/:id */
export const adminDeleteMenuItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.transaction(async (tx) => {
    await tx.update(menuItems).set({ parent_id: null }).where(eq(menuItems.parent_id, id));
    await tx.delete(menuItems).where(eq(menuItems.id, id));
  });
  return reply.code(204).send();
};

/** POST /admin/menu_items/reorder */
export const adminReorderMenuItems: RouteHandler = async (req, reply) => {
  const { items } = adminMenuItemReorderSchema.parse(req.body ?? {});

  const ids = items.map((i) => i.id);
  const rows = await db
    .select({
      id: menuItems.id,
      parent_id: menuItems.parent_id,
      location: menuItems.location,
      section_id: menuItems.section_id,
    })
    .from(menuItems)
    .where(inArray(menuItems.id, ids));

  // Aynı "bucket" içinde mi? (parent_id, location, section_id)
  const parentSet = new Set(rows.map((r) => r.parent_id ?? "ROOT"));
  const locationSet = new Set(rows.map((r) => r.location));
  const sectionSet = new Set(rows.map((r) => r.section_id ?? "NOSEC"));

  if (parentSet.size > 1 || locationSet.size > 1 || sectionSet.size > 1) {
    return reply.code(400).send({ error: { message: "mixed_groups" } });
  }

  await db.transaction(async (tx) => {
    const now = new Date();
    for (const it of items) {
      await tx
        .update(menuItems)
        .set({ order_num: it.display_order, updated_at: now })
        .where(eq(menuItems.id, it.id));
    }
  });

  return reply.send({ ok: true });
};
