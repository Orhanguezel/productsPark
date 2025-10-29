import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq, isNull, like } from "drizzle-orm";
import { menuItems } from "./schema";
import {
  adminMenuItemListQuerySchema,
  adminMenuItemUpsertSchema,
  adminMenuItemReorderSchema,
  type AdminMenuItemListQuery,
  type AdminMenuItemUpsert,
} from "./validation";

/** küçük yardımcılar */
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}
const toIntMaybe = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** DB -> Admin FE map (BE kolonları yoksa null/varsayılan dönüyoruz) */
function mapRowToAdmin(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    title: r.label,
    url: r.url ?? null,
    type: "custom" as const,          // şimdilik DB’de kolon yoksa default
    page_id: null as string | null,   // —
    parent_id: r.parent_id ?? null,
    location: "header" as const,      // kolon yoksa varsayılan (header)
    icon: null as string | null,
    section_id: null as string | null,
    is_active: !!r.is_active,
    display_order: r.order_num ?? 0,
    created_at: r.created_at?.toISOString?.() ?? undefined,
    updated_at: r.updated_at?.toISOString?.() ?? undefined,
  };
}

/** Sıralama çözümleyici (display_order -> order_num) */
function resolveOrder(q: AdminMenuItemListQuery) {
  const dir = q.order === "desc" ? "desc" : "asc";
  const col =
    q.sort === "created_at" ? menuItems.created_at
    : q.sort === "title" ? menuItems.label
    : menuItems.order_num; // display_order/default
  return { col, dir };
}

/** GET /admin/menu_items */
export const adminListMenuItems: RouteHandler = async (req, reply) => {
  const q = adminMenuItemListQuerySchema.parse(req.query ?? {});
  const conds: any[] = [];

  // metin arama
  if (q.q && q.q.trim()) {
    const likeExpr = `%${q.q.trim()}%`;
    conds.push(like(menuItems.label, likeExpr));
  }

  // parent_id
  if (q.parent_id !== undefined) {
    if (q.parent_id === null) conds.push(isNull(menuItems.parent_id));
    else conds.push(eq(menuItems.parent_id, q.parent_id));
  }

  // is_active
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(menuItems.is_active, b));
  }

  let qb = db.select().from(menuItems).$dynamic();
  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  const { col, dir } = resolveOrder(q);
  qb = qb.orderBy(dir === "desc" ? desc(col) : asc(col));

  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;
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
    const body = adminMenuItemUpsertSchema.parse(req.body ?? {}) as AdminMenuItemUpsert;
    const now = new Date();
    const orderNum = body.display_order ?? 0;

    await db.insert(menuItems).values({
      id: randomUUID(),
      label: body.title,
      url: body.url ?? "",
      parent_id: body.parent_id ?? null,
      order_num: orderNum,
      is_active: toBool(body.is_active) ?? true,
      created_at: now,
      updated_at: now,
    });

    const [row] = await db
      .select()
      .from(menuItems)
      .orderBy(desc(menuItems.created_at))
      .limit(1);

    return reply.code(201).send(mapRowToAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** PATCH /admin/menu_items/:id */
export const adminUpdateMenuItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const patch = adminMenuItemUpsertSchema.partial().parse(req.body ?? {}) as Partial<AdminMenuItemUpsert>;
    const now = new Date();

    const set: Partial<typeof menuItems.$inferInsert> = { updated_at: now };
    if (patch.title !== undefined) set.label = patch.title;
    if (patch.url !== undefined) set.url = patch.url ?? "";
    if (patch.parent_id !== undefined) set.parent_id = patch.parent_id ?? null;
    if (patch.display_order !== undefined) set.order_num = patch.display_order;
    if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active) ?? true;

    await db.update(menuItems).set(set).where(eq(menuItems.id, id));

    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(mapRowToAdmin(row));
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** DELETE /admin/menu_items/:id */
export const adminDeleteMenuItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(menuItems).where(eq(menuItems.id, id));
  return reply.code(204).send();
};

/** POST /admin/menu_items/reorder  { items: [{id, display_order}, ...] } */
export const adminReorderMenuItems: RouteHandler = async (req, reply) => {
  const { items } = adminMenuItemReorderSchema.parse(req.body ?? {});
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const it of items) {
      await tx
        .update(menuItems)
        .set({ order_num: it.display_order, updated_at: now })
        .where(eq(menuItems.id, it.id));
    }
  });

  return reply.send({ ok: true });
};
