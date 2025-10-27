import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { categories } from './schema';
import { and, asc, desc, eq, sql, isNull } from 'drizzle-orm';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from './validation';

const nullIfEmpty = (v: unknown) => (v === '' ? null : v);

// FE’den gelen her türü -> boolean
function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true';
}

const ORDER_WHITELIST = {
  display_order: categories.display_order,
  name: categories.name,
  created_at: categories.created_at,
  updated_at: categories.updated_at,
} as const;

function parseOrder(q: Record<string, unknown>) {
  const sort = typeof q.sort === 'string' ? q.sort : undefined;
  const dir1 = typeof q.order === 'string' ? q.order : undefined;
  const combined = typeof q.order === 'string' && q.order.includes('.') ? q.order : undefined;

  let col: keyof typeof ORDER_WHITELIST = 'created_at';
  let dir: 'asc' | 'desc' = 'desc';

  if (combined) {
    const [c, d] = combined.split('.');
    if (c && (c in ORDER_WHITELIST)) col = c as keyof typeof ORDER_WHITELIST;
    if (d === 'asc' || d === 'desc') dir = d;
  } else {
    if (sort && (sort in ORDER_WHITELIST)) col = sort as keyof typeof ORDER_WHITELIST;
    if (dir1 === 'asc' || dir1 === 'desc') dir = dir1;
  }

  const colExpr = ORDER_WHITELIST[col];
  return { primary: dir === 'asc' ? colExpr : desc(colExpr), primaryCol: col };
}

/** GET /categories (public) */
export const listCategories: RouteHandler<{
  Querystring: {
    q?: string;
    parent_id?: string | null;
    is_active?: string | number | boolean;
    is_featured?: string | number | boolean;
    limit?: string | number;
    offset?: string | number;
    sort?: string;
    order?: string;
  };
}> = async (req, reply) => {
  const q = req.query ?? {};
  const conds: any[] = [];

  if (q.q) {
    const s = `%${String(q.q).trim()}%`;
    conds.push(sql`${categories.name} LIKE ${s} OR ${categories.slug} LIKE ${s}`);
  }

  if (q.parent_id !== undefined) {
    const v = q.parent_id;
    if (v === null || v === 'null') conds.push(isNull(categories.parent_id));
    else if (typeof v === 'string' && v.length > 0) conds.push(eq(categories.parent_id, v));
  }

  // 🟢 boolean kolona boolean gönder
  if (q.is_active !== undefined) conds.push(eq(categories.is_active, toBool(q.is_active)));
  if (q.is_featured !== undefined) conds.push(eq(categories.is_featured, toBool(q.is_featured)));

  const where = conds.length ? and(...conds) : undefined;

  const limit = Math.min(Number(q.limit ?? 50) || 50, 100);
  const offset = Math.max(Number(q.offset ?? 0) || 0, 0);
  const { primary, primaryCol } = parseOrder(q as any);

  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(categories);
  const [{ total }] = where ? await countBase.where(where as any) : await countBase;

  const rowsBase = db.select().from(categories);
  const rowsQ = where ? rowsBase.where(where as any) : rowsBase;

  const orderExprs: any[] = [primary as any];
  if (primaryCol !== 'display_order') orderExprs.push(asc(categories.display_order));

  const rows = await rowsQ.orderBy(...orderExprs).limit(limit).offset(offset);

  reply.header('x-total-count', String(total));
  reply.header('content-range', `*/${total}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(rows);
};

/** GET /categories/:id (public) */
export const getCategoryById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

/** GET /categories/by-slug/:slug (public) */
export const getCategoryBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const { slug } = req.params;
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

/** Ortak payload yardımcıları (admin controller kullanıyor) */
export function buildInsertPayload(input: CategoryCreateInput) {
  const id = input.id ?? randomUUID();
  const name = String(input.name ?? '').trim();
  const slug = String(input.slug ?? '').trim();

  return {
    id,
    name,
    slug,
    description: (nullIfEmpty(input.description) as string | null) ?? null,
    image_url: (nullIfEmpty(input.image_url) as string | null) ?? null,
    icon: (nullIfEmpty(input.icon) as string | null) ?? null,
    parent_id: (nullIfEmpty(input.parent_id) as string | null) ?? null,
    // 🟢 boolean kolonlar
    is_active: input.is_active === undefined ? true : toBool(input.is_active),
    is_featured: input.is_featured === undefined ? false : toBool(input.is_featured),
    display_order: input.display_order ?? 0,
    // updated_at göndermiyoruz; DB default/ON UPDATE çalışır
  };
}

export function buildUpdatePayload(patch: CategoryUpdateInput) {
  const set: Record<string, unknown> = {
    // 🟢 Drizzle tipine uygun: string | SQL bekler
    updated_at: sql`CURRENT_TIMESTAMP(3)`,
  };

  if (patch.name !== undefined) set.name = String(patch.name).trim();
  if (patch.slug !== undefined) set.slug = String(patch.slug).trim();
  if (patch.description !== undefined) set.description = (nullIfEmpty(patch.description) as string | null);
  if (patch.image_url !== undefined) set.image_url = (nullIfEmpty(patch.image_url) as string | null);
  if (patch.icon !== undefined) set.icon = (nullIfEmpty(patch.icon) as string | null);
  if (patch.parent_id !== undefined) set.parent_id = (nullIfEmpty(patch.parent_id) as string | null);

  // 🟢 boolean kolonlar
  if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active);
  if (patch.is_featured !== undefined) set.is_featured = toBool(patch.is_featured);

  if (patch.display_order !== undefined) set.display_order = Number(patch.display_order) || 0;
  return set;
}
