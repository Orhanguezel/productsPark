// ===================================================================
// FILE: src/modules/newsletter/admin.controller.ts
// FINAL — Newsletter Admin Controller (Single Language)
// - locale removed
// ===================================================================

import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { newsletterSubscribers, type NewsletterRow, type NewsletterInsert } from './schema';
import {
  newsletterListQuerySchema,
  newsletterAdminUpdateSchema,
  type NewsletterListQuery,
  type NewsletterAdminUpdateInput,
} from './validation';
import { and, asc, desc, eq, isNull, not, sql, type SQL } from 'drizzle-orm';

// Helpers
const toBool = (v: unknown): boolean | undefined => {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
};

function safeOrderCol(col?: string) {
  switch (col) {
    case 'email':
      return newsletterSubscribers.email;
    case 'verified':
      return newsletterSubscribers.is_verified;
    case 'updated_at':
      return newsletterSubscribers.updated_at;
    case 'created_at':
    default:
      return newsletterSubscribers.created_at;
  }
}

function parseMeta(metaStr: unknown): any {
  const s = String(metaStr ?? '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function mapRowAdmin(row: NewsletterRow) {
  return {
    id: row.id,
    email: row.email,
    is_verified: !!row.is_verified,
    is_subscribed: !row.unsubscribed_at,
    meta: parseMeta(row.meta),
    created_at: row.created_at,
    updated_at: row.updated_at,
    unsubscribed_at: row.unsubscribed_at ?? null,
  };
}

/** GET /admin/newsletter */
export const listNewsletterAdmin: RouteHandler = async (req, reply) => {
  const parsed = newsletterListQuerySchema.safeParse((req.query ?? {}) as NewsletterListQuery);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'INVALID_QUERY', issues: parsed.error.issues },
    });
  }

  const q = parsed.data;
  const filters: SQL[] = [];

  if (q.q && q.q.trim()) {
    const likeStr = `%${q.q.trim()}%`;
    filters.push(sql`${newsletterSubscribers.email} LIKE ${likeStr}`);
  }

  if (q.email) {
    filters.push(eq(newsletterSubscribers.email, q.email.trim().toLowerCase()));
  }

  if (typeof q.verified !== 'undefined') {
    const b = toBool(q.verified);
    if (typeof b === 'boolean') {
      filters.push(eq(newsletterSubscribers.is_verified, b));
    }
  }

  if (typeof q.subscribed !== 'undefined') {
    const b = toBool(q.subscribed);
    if (b === true) filters.push(isNull(newsletterSubscribers.unsubscribed_at));
    else if (b === false) filters.push(not(isNull(newsletterSubscribers.unsubscribed_at)));
  }

  const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

  const orderCol = safeOrderCol(q.orderBy);
  const orderDir = q.order === 'asc' ? 'asc' : 'desc';
  const orderExpr = orderDir === 'asc' ? asc(orderCol) : desc(orderCol);

  const limit = q.limit ?? 50;
  const offset = q.offset ?? 0;

  // Count
  let countQuery = db
    .select({ total: sql<number>`COUNT(*)` })
    .from(newsletterSubscribers)
    .$dynamic();

  if (whereExpr) countQuery = countQuery.where(whereExpr);

  const [countRow] = await countQuery;
  const total = Number(countRow?.total ?? 0);

  // Data
  let dataQuery = db.select().from(newsletterSubscribers).$dynamic();
  if (whereExpr) dataQuery = dataQuery.where(whereExpr);

  const rows = await dataQuery.orderBy(orderExpr).limit(limit).offset(offset);

  reply.header('x-total-count', String(total));
  reply.header('content-range', `*/${total}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(rows.map(mapRowAdmin));
};

/** GET /admin/newsletter/:id */
export const getNewsletterAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(mapRowAdmin(row));
};

/** PATCH /admin/newsletter/:id */
export const updateNewsletterAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const parsed = newsletterAdminUpdateSchema.safeParse(
    (req.body ?? {}) as NewsletterAdminUpdateInput,
  );
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'INVALID_BODY', issues: parsed.error.issues },
    });
  }

  const body = parsed.data;
  const patch: Partial<NewsletterInsert> = {};
  const now = new Date();

  if (typeof body.verified !== 'undefined') {
    const b = toBool(body.verified);
    if (typeof b === 'boolean') patch.is_verified = b;
  }

  if (typeof body.subscribed !== 'undefined') {
    const b = toBool(body.subscribed);
    if (typeof b === 'boolean') patch.unsubscribed_at = b ? (null as any) : (now as any);
  }

  if (typeof body.meta !== 'undefined') {
    patch.meta = body.meta == null ? '{}' : JSON.stringify(body.meta);
  }

  if (!Object.keys(patch).length) {
    const [row] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .limit(1);

    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(mapRowAdmin(row));
  }

  await db
    .update(newsletterSubscribers)
    .set({ ...patch, updated_at: now as any })
    .where(eq(newsletterSubscribers.id, id));

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(mapRowAdmin(row));
};

/** DELETE /admin/newsletter/:id */
export const removeNewsletterAdmin: RouteHandler = async (req, reply) => {
  const { id } = (req.params ?? {}) as { id: string };

  const res = await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .execute();

  const affected = (res as any)?.affectedRows != null ? Number((res as any).affectedRows) : 0;

  if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.code(204).send();
};
