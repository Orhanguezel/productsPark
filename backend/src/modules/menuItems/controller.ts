import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { menuItems } from './schema';
import {
  menuItemCreateSchema,
  menuItemUpdateSchema,
  menuItemListQuerySchema,
  type MenuItemCreateInput,
  type MenuItemUpdateInput,
  type MenuItemListQuery,
} from './validation';

// ---- helpers ----
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
}
function toIntMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** DB → FE (MenuItemRow) map */
function mapRow(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    title: r.label,
    url: r.url,

    // FE kesin alanlar:
    section_id: null as string | null,         // DB'de yok
    icon: null as string | null,               // DB'de yok
    is_active: !!r.is_active,

    // opsiyoneller:
    href: null as string | null,               // DB'de yok
    slug: null as string | null,               // DB'de yok
    parent_id: r.parent_id ?? null,
    position: r.order_num,                     // FE convenience
    order_num: r.order_num,                    // FE convenience (tipine ekledin)
    locale: null as string | null,             // DB'de yok
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

// "display_order" | "position" | "order_num" | "created_at" | "updated_at"
function resolveOrderCol(s?: string) {
  const [col, dirRaw] = (s ?? '').split('.');
  const dir = dirRaw === 'desc' ? 'desc' : 'asc';
  const colRef =
    col === 'display_order' || col === 'position' || col === 'order_num' ? menuItems.order_num :
    col === 'created_at' ? menuItems.created_at :
    col === 'updated_at' ? menuItems.updated_at :
    // default
    menuItems.order_num;
  return { colRef, dir };
}

/** GET /menu_items */
export const listMenuItems: RouteHandler = async (req, reply) => {
  const q = menuItemListQuerySchema.parse(req.query ?? {}) as MenuItemListQuery;
  const conditions: unknown[] = [];

  if (q.parent_id !== undefined) {
    if (q.parent_id === null) {
      conditions.push(isNull(menuItems.parent_id));
    } else {
      conditions.push(eq(menuItems.parent_id, q.parent_id));
    }
  }
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conditions.push(eq(menuItems.is_active, b));
  }

  let qb = db.select().from(menuItems).$dynamic();

  if (conditions.length === 1) qb = qb.where(conditions[0] as any);
  else if (conditions.length > 1) qb = qb.where(and(...(conditions as any)));

  const { colRef, dir } = resolveOrderCol(q.order);
  qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));

  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};

/** GET /menu_items/:id */
export const getMenuItemById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapRow(rows[0]));
};

/** POST /menu_items */
export const createMenuItem: RouteHandler = async (req, reply) => {
  try {
    const body = menuItemCreateSchema.parse(req.body ?? {}) as MenuItemCreateInput;
    const now = new Date();

    const orderNum =
      body.position !== undefined ? body.position :
      body.order_num !== undefined ? body.order_num : 0;

    await db.insert(menuItems).values({
      id: randomUUID(),
      label: body.title,
      url: body.url,
      parent_id: body.parent_id ?? null,
      order_num: orderNum,
      is_active: toBool(body.is_active) ?? true,
      created_at: now,
      updated_at: now,
    });

    // yeni kaydı getir (basitçe en son oluşturulana bakıyoruz)
    const [row] = await db.select().from(menuItems)
      .orderBy(desc(menuItems.created_at))
      .limit(1);

    return reply.code(201).send(mapRow(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** PATCH /menu_items/:id */
export const updateMenuItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const patch = menuItemUpdateSchema.parse(req.body ?? {}) as MenuItemUpdateInput;
    const now = new Date();

    const set: Partial<typeof menuItems.$inferInsert> = { updated_at: now };
    if (patch.title !== undefined) set.label = patch.title;
    if (patch.url !== undefined) set.url = patch.url;
    if (patch.parent_id !== undefined) set.parent_id = patch.parent_id;
    if (patch.position !== undefined) set.order_num = patch.position;
    if (patch.order_num !== undefined) set.order_num = patch.order_num;
    if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active) ?? true;

    await db.update(menuItems).set(set).where(eq(menuItems.id, id));

    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(mapRow(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** DELETE /menu_items/:id */
export const deleteMenuItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(menuItems).where(eq(menuItems.id, id));
  return reply.code(204).send();
};
