// src/modules/payments/admin.sessions.controller.ts
import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { paymentSessions } from './schema';
import { parseJsonObject, toDecimal, toJsonString } from './admin.utils';

// ---------- validations ----------
const listPaymentSessionsAdminQuery = z
  .object({
    order_id: z.string().uuid().optional(),
    provider_key: z.string().optional(),
    status: z.string().optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(0).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .partial();

const createPaymentSessionAdminBody = z.object({
  provider_key: z.string().min(1),
  order_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1).default('TRY'),
  status: z.string().min(1).default('pending'),
  extra: z.record(z.unknown()).nullable().optional(),
});

// ---------- mapper ----------
const mapSessionAdmin = (r: typeof paymentSessions.$inferSelect) => ({
  id: r.id,
  provider_key: r.providerKey,
  order_id: r.orderId ?? null,
  amount: Number(r.amount),
  currency: r.currency,
  status: r.status,
  client_secret: r.clientSecret ?? null,
  iframe_url: r.iframeUrl ?? null,
  redirect_url: r.redirectUrl ?? null,
  extra: parseJsonObject(r.extra),
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
});

// ---------- handlers ----------
export async function listPaymentSessionsAdminHandler(
  req: FastifyRequest<{
    Querystring: {
      order_id?: string;
      provider_key?: string;
      status?: string;
      q?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  const parsed = listPaymentSessionsAdminQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { order_id, provider_key, status, q, limit = 50, offset = 0 } = parsed.data;

  const conds: SQL[] = [];
  if (order_id) conds.push(eq(paymentSessions.orderId, order_id));
  if (provider_key) conds.push(eq(paymentSessions.providerKey, provider_key));
  if (status) conds.push(eq(paymentSessions.status, status));
  if (q) {
    const pat = `%${q}%`;
    conds.push(
      sql`(
        COALESCE(${paymentSessions.id}, '') LIKE ${pat}
        OR COALESCE(${paymentSessions.providerKey}, '') LIKE ${pat}
        OR COALESCE(${paymentSessions.orderId}, '') LIKE ${pat}
      )`
    );
  }

  const total =
    (
      await (conds.length
        ? db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentSessions)
            .where(and(...conds))
        : db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentSessions))
    )[0]?.total ?? 0;

  const rows = conds.length
    ? await db
        .select()
        .from(paymentSessions)
        .where(and(...conds))
        .orderBy(desc(paymentSessions.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0))
    : await db
        .select()
        .from(paymentSessions)
        .orderBy(desc(paymentSessions.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0));

  const data = rows.map(mapSessionAdmin);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);

  return reply.send(data);
}

export async function getPaymentSessionAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(mapSessionAdmin(row));
}

export async function createPaymentSessionAdminHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createPaymentSessionAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const id = crypto.randomUUID();
  const b = parsed.data;

  await db.insert(paymentSessions).values({
    id,
    providerKey: b.provider_key,
    orderId: b.order_id ?? null,
    amount: toDecimal(b.amount) as any,
    currency: b.currency,
    status: b.status,
    clientSecret: null,
    iframeUrl: null,
    redirectUrl: null,
    extra: toJsonString(b.extra ?? null),
  });

  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, id))
    .limit(1);

  return reply.code(201).send(mapSessionAdmin(row));
}

export async function capturePaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ success: false, status: 'failed' });
  }

  await db
    .update(paymentSessions)
    .set({ status: 'captured', updatedAt: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(paymentSessions.id, req.params.id));

  return reply.send({ success: true, status: 'captured' });
}

export async function cancelPaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ success: false });
  }

  await db
    .update(paymentSessions)
    .set({ status: 'cancelled', updatedAt: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(paymentSessions.id, req.params.id));

  return reply.send({ success: true });
}

export async function syncPaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ success: false });
  }

  return reply.send({ success: true, status: row.status as string });
}
