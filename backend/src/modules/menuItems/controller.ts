import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { and, asc, desc, eq, isNull, like, sql } from "drizzle-orm";
import { menuItems } from "./schema";
import {
  menuItemListQuerySchema,
  type MenuItemListQuery,
} from "./validation";

// helpers
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}
function toIntMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** DB → FE map (public) */
function mapRow(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    title: r.label,
    url: r.url,
    section_id: r.section_id ?? null,
    icon: r.icon ?? null,
    is_active: !!r.is_active,
    href: null as string | null,
    slug: null as string | null,
    parent_id: r.parent_id ?? null,
    position: r.order_num,
    order_num: r.order_num,
    locale: null as string | null,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,

    // yeni alanlar
    location: r.location,
    type: r.type,
    page_id: r.page_id ?? null,
    display_order: r.order_num,
  };
}

// "display_order|position|order_num|created_at|updated_at[.desc]"
function resolveOrderCol(s?: string) {
  const [col, dirRaw] = (s ?? "").split(".");
  const dir = dirRaw === "desc" ? "desc" : "asc";
  const colRef =
    col === "display_order" || col === "position" || col === "order_num"
      ? menuItems.order_num
      : col === "created_at"
      ? menuItems.created_at
      : col === "updated_at"
      ? menuItems.updated_at
      : menuItems.order_num;
  return { colRef, dir };
}

/** GET /menu_items */
export const listMenuItems: RouteHandler = async (req, reply) => {
  const q = menuItemListQuerySchema.parse(req.query ?? {}) as MenuItemListQuery;
  const conditions: any[] = [];

  // aktif
  if (q.is_active === undefined) conditions.push(eq(menuItems.is_active, true));
  else {
    const b = toBool(q.is_active);
    if (b !== undefined) conditions.push(eq(menuItems.is_active, b));
  }

  // parent
  if (q.parent_id !== undefined) {
    conditions.push(q.parent_id === null ? isNull(menuItems.parent_id) : eq(menuItems.parent_id, q.parent_id));
  }

  // NEW: location
  if (q.location) conditions.push(eq(menuItems.location, q.location as any));

  // NEW: section
  if (q.section_id !== undefined) {
    conditions.push(q.section_id === null ? isNull(menuItems.section_id) : eq(menuItems.section_id, q.section_id));
  }

  const whereExpr = conditions.length ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(menuItems).where(whereExpr as any);

  const { colRef, dir } = resolveOrderCol(q.order);
  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);

  let qb = db.select().from(menuItems).$dynamic();
  if (whereExpr) qb = qb.where(whereExpr as any);
  qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;

  reply.header('x-total-count', String(total));
  reply.header('content-range', `*/${total}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(rows.map((r) => ({
    id: r.id,
    title: r.label,
    url: r.url,
    section_id: r.section_id ?? null,
    icon: r.icon ?? null,
    is_active: !!r.is_active,
    href: null,
    slug: null,
    parent_id: r.parent_id ?? null,
    position: r.order_num,
    order_num: r.order_num,
    locale: null,
    created_at: r.created_at?.toISOString?.(),
    updated_at: r.updated_at?.toISOString?.(),
    // optional:
    location: r.location,
    type: r.type,
    page_id: r.page_id ?? null,
  })));
};

/** GET /menu_items/:id */
export const getMenuItemById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRow(rows[0]));
};
