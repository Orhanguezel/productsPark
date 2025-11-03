import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq, isNull, like, inArray, sql } from 'drizzle-orm';
import { menuItems } from './schema';
import {
  adminMenuItemListQuerySchema,
  adminMenuItemCreateSchema,
  adminMenuItemUpdateSchema,
  adminMenuItemReorderSchema,
  type AdminMenuItemListQuery,
  type AdminMenuItemCreate,
  type AdminMenuItemUpdate,
} from './validation';

/** helpers */
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
}
const toIntMaybe = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** DB -> Admin FE map */
function mapRowToAdmin(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    title: r.label,
    url: r.url ?? null,
    type: 'custom' as const,         // şimdilik
    page_id: null as string | null,
    parent_id: r.parent_id ?? null,
    location: 'header' as const,     // şimdilik
    icon: null as string | null,
    section_id: null as string | null,
    is_active: !!r.is_active,
    display_order: r.order_num ?? 0,
    created_at: r.created_at?.toISOString?.(),
    updated_at: r.updated_at?.toISOString?.(),
  };
}

/** Sıralama */
function resolveOrder(q: AdminMenuItemListQuery) {
  const dir = q.order === 'desc' ? 'desc' : 'asc';
  const col =
    q.sort === 'created_at' ? menuItems.created_at
    : q.sort === 'title' ? menuItems.label
    : menuItems.order_num; // default: display_order
  return { col, dir };
}

/** GET /admin/menu_items */
export const adminListMenuItems: RouteHandler = async (req, reply) => {
  const q = adminMenuItemListQuerySchema.parse(req.query ?? {});
  const conds: any[] = [];

  if (q.q && q.q.trim()) {
    const likeExpr = `%${q.q.trim()}%`;
    conds.push(like(menuItems.label, likeExpr));
  }
  if (q.parent_id !== undefined) {
    if (q.parent_id === null) conds.push(isNull(menuItems.parent_id));
    else conds.push(eq(menuItems.parent_id, q.parent_id));
  }
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(menuItems.is_active, b));
  }

  const whereExpr = conds.length ? (conds.length === 1 ? conds[0] : and(...conds)) : undefined;

  // total count
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
  qb = qb.orderBy(dir === 'desc' ? desc(col) : asc(col));
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;

  reply.header('x-total-count', String(total));
  reply.header('content-range', `*/${total}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(rows.map(mapRowToAdmin));
};

/** GET /admin/menu_items/:id */
export const adminGetMenuItemById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapRowToAdmin(rows[0]));
};

/** POST /admin/menu_items */
export const adminCreateMenuItem: RouteHandler = async (req, reply) => {
  try {
    const body = adminMenuItemCreateSchema.parse(req.body ?? {}) as AdminMenuItemCreate;
    const id = randomUUID();

    await db.insert(menuItems).values({
      id,
      label: body.title,
      url: body.url ?? '',
      parent_id: body.parent_id ?? null,
      order_num: body.display_order ?? 0,
      is_active: toBool(body.is_active) ?? true,
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
    const patch = adminMenuItemUpdateSchema.parse(req.body ?? {}) as AdminMenuItemUpdate;

    const set: Partial<typeof menuItems.$inferInsert> = {};
    if (patch.title !== undefined) set.label = patch.title;
    if (patch.url !== undefined) set.url = patch.url ?? '';
    if (patch.display_order !== undefined) set.order_num = patch.display_order;
    if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active) ?? true;

    // parent kontrolü (self-loop ve varlık)
    if (patch.parent_id !== undefined) {
      if (patch.parent_id === id) {
        return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
      }
      if (patch.parent_id) {
        const [exists] = await db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.id, patch.parent_id))
          .limit(1);
        if (!exists) return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
        set.parent_id = patch.parent_id;
      } else {
        set.parent_id = null;
      }
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

/** POST /admin/menu_items/reorder  { items: [{id, display_order}, ...] } */
export const adminReorderMenuItems: RouteHandler = async (req, reply) => {
  const { items } = adminMenuItemReorderSchema.parse(req.body ?? {});

  // Aynı parent içinde mi?
  const ids = items.map((i) => i.id);
  const rows = await db
    .select({ id: menuItems.id, parent_id: menuItems.parent_id })
    .from(menuItems)
    .where(inArray(menuItems.id, ids));

  const parentSet = new Set(rows.map((r) => r.parent_id ?? 'ROOT'));
  if (parentSet.size > 1) {
    return reply.code(400).send({ error: { message: 'mixed_parent_ids' } });
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
