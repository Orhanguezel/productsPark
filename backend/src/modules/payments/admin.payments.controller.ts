// src/modules/payments/admin.payments.controller.ts
import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { payments, paymentEvents } from './schema';
import { parseJsonObject, toDecimal, toJsonString } from './admin.utils';

// ---------- validations ----------
const listPaymentsAdminQuery = z
  .object({
    q: z.string().optional(),
    provider: z.string().optional(),
    status: z.string().optional(),
    order_id: z.string().uuid().optional(),
    is_test: z
      .union([
        z.boolean(),
        z.literal(0),
        z.literal(1),
        z.literal('0'),
        z.literal('1'),
        z.literal('true'),
        z.literal('false'),
      ])
      .optional(),
    min_amount: z.coerce.number().optional(),
    max_amount: z.coerce.number().optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(0).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    sort: z
      .enum([
        'created_at',
        'updated_at',
        'amount_captured',
        'amount_authorized',
        'status',
      ])
      .optional(),
    order: z.enum(['asc', 'desc']).optional(),
    include: z.string().optional(),
  })
  .partial();

const capturePaymentBody = z
  .object({
    amount: z.coerce.number().positive().optional(),
    idempotency_key: z.string().optional(),
  })
  .partial();

const refundPaymentBody = z
  .object({
    amount: z.coerce.number().positive().optional(),
    reason: z.string().optional(),
  })
  .partial();

const voidPaymentBody = z
  .object({
    reason: z.string().optional(),
  })
  .partial();

// ---------- mappers ----------
const mapPaymentAdmin = (r: typeof payments.$inferSelect) => ({
  id: r.id,
  order_id: r.orderId ?? null,
  provider: r.provider,
  currency: r.currency,
  amount_authorized: Number(r.amountAuthorized),
  amount_captured: Number(r.amountCaptured),
  amount_refunded: Number(r.amountRefunded),
  fee_amount: r.feeAmount != null ? Number(r.feeAmount) : null,
  status: r.status,
  reference: r.reference ?? null,
  transaction_id: r.transactionId ?? null,
  is_test: Boolean(r.isTest),
  metadata: parseJsonObject(r.metadata),
  created_at: r.createdAt ? String(r.createdAt) : '',
  updated_at: r.updatedAt ? String(r.updatedAt) : null,
});

const mapPaymentEventAdmin = (r: typeof paymentEvents.$inferSelect) => ({
  id: r.id,
  payment_id: r.paymentId,
  event_type: r.eventType,
  message: r.message,
  raw: parseJsonObject(r.raw),
  created_at: r.createdAt ? String(r.createdAt) : '',
});

// ---------- handlers ----------
export async function listPaymentsAdminHandler(
  req: FastifyRequest<{
    Querystring: {
      q?: string;
      provider?: string;
      status?: string;
      order_id?: string;
      is_test?: string | number | boolean;
      min_amount?: string | number;
      max_amount?: string | number;
      starts_at?: string;
      ends_at?: string;
      limit?: string;
      offset?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      include?: string;
    };
  }>,
  reply: FastifyReply
) {
  const parsed = listPaymentsAdminQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const {
    q,
    provider,
    status,
    order_id,
    is_test,
    min_amount,
    max_amount,
    starts_at,
    ends_at,
    limit = 50,
    offset = 0,
    sort = 'created_at',
    order = 'desc',
  } = parsed.data;

  const conds: SQL[] = [];

  if (provider) conds.push(eq(payments.provider, provider));
  if (status) conds.push(eq(payments.status, status));
  if (order_id) conds.push(eq(payments.orderId, order_id));

  if (typeof is_test !== 'undefined') {
    const flag =
      is_test === true ||
      is_test === 1 ||
      is_test === '1' ||
      is_test === 'true'
        ? 1
        : 0;
    conds.push(eq(payments.isTest, flag as any));
  }

  if (min_amount != null) {
    conds.push(gte(payments.amountAuthorized, toDecimal(min_amount) as any));
  }
  if (max_amount != null) {
    conds.push(lte(payments.amountAuthorized, toDecimal(max_amount) as any));
  }
  if (starts_at) {
    conds.push(gte(payments.createdAt, new Date(starts_at) as any));
  }
  if (ends_at) {
    conds.push(lte(payments.createdAt, new Date(ends_at) as any));
  }

  if (q) {
    const pat = `%${q}%`;
    conds.push(
      sql`(
        COALESCE(${payments.reference}, '') LIKE ${pat}
        OR COALESCE(${payments.transactionId}, '') LIKE ${pat}
      )`
    );
  }

  const whereSql = conds.length ? and(...conds) : undefined;

  const total =
    (
      await (whereSql
        ? db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(payments)
            .where(whereSql)
        : db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(payments))
    )[0]?.total ?? 0;

  const orderByExpr =
    sort === 'updated_at'
      ? order === 'asc'
        ? (payments.updatedAt as any)
        : desc(payments.updatedAt)
      : sort === 'amount_captured'
      ? order === 'asc'
        ? (payments.amountCaptured as any)
        : desc(payments.amountCaptured)
      : sort === 'amount_authorized'
      ? order === 'asc'
        ? (payments.amountAuthorized as any)
        : desc(payments.amountAuthorized)
      : sort === 'status'
      ? order === 'asc'
        ? (payments.status as any)
        : desc(payments.status)
      : order === 'asc'
      ? (payments.createdAt as any)
      : desc(payments.createdAt);

  const rows = whereSql
    ? await db
        .select()
        .from(payments)
        .where(whereSql)
        .orderBy(orderByExpr)
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0))
    : await db
        .select()
        .from(payments)
        .orderBy(orderByExpr)
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0));

  const data = rows.map(mapPaymentAdmin);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);

  return reply.send(data);
}

export async function getPaymentAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(mapPaymentAdmin(row));
}

export async function capturePaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = capturePaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  const currentCaptured = Number(row.amountCaptured);
  const maxCapture = Number(row.amountAuthorized) - currentCaptured;
  const amount =
    parsed.data.amount != null
      ? Math.min(parsed.data.amount, maxCapture)
      : maxCapture;

  await db
    .update(payments)
    .set({
      amountCaptured: toDecimal(currentCaptured + amount) as any,
      status:
        currentCaptured + amount >= Number(row.amountAuthorized)
          ? 'captured'
          : row.status,
      updatedAt: sql`CURRENT_TIMESTAMP(3)`,
    })
    .where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'capture',
    message: `Captured ${amount}`,
    raw: toJsonString({ amount }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  return reply.send(mapPaymentAdmin(updated));
}

export async function refundPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = refundPaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  const currentRefunded = Number(row.amountRefunded);
  const refundable = Number(row.amountCaptured) - currentRefunded;
  const amount =
    parsed.data.amount != null
      ? Math.min(parsed.data.amount, refundable)
      : refundable;

  const newRefunded = currentRefunded + amount;

  const newStatus =
    newRefunded <= 0
      ? row.status
      : newRefunded < Number(row.amountCaptured)
      ? 'partially_refunded'
      : 'refunded';

  await db
    .update(payments)
    .set({
      amountRefunded: toDecimal(newRefunded) as any,
      status: newStatus,
      updatedAt: sql`CURRENT_TIMESTAMP(3)`,
    })
    .where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'refund',
    message: `Refunded ${amount}${
      parsed.data.reason ? ` | reason: ${parsed.data.reason}` : ''
    }`,
    raw: toJsonString({ amount, reason: parsed.data.reason ?? null }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  return reply.send(mapPaymentAdmin(updated));
}

export async function voidPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = voidPaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  await db
    .update(payments)
    .set({
      status: 'voided',
      updatedAt: sql`CURRENT_TIMESTAMP(3)`,
    })
    .where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'void',
    message: `Voided${
      (parsed.data as any)?.reason ? ` | reason: ${(parsed.data as any).reason}` : ''
    }`,
    raw: toJsonString({ reason: (parsed.data as any)?.reason ?? null }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  return reply.send(mapPaymentAdmin(updated));
}

export async function syncPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'sync',
    message: 'Manual sync',
    raw: toJsonString({ ok: true }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, req.params.id))
    .limit(1);

  return reply.send(mapPaymentAdmin(updated));
}

export async function listPaymentEventsAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const rows = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.paymentId, req.params.id))
    .orderBy(desc(paymentEvents.createdAt));

  return reply.send(rows.map(mapPaymentEventAdmin));
}
