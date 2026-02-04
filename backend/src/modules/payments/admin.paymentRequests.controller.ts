// ===================================================================
// FILE: src/modules/payments/admin.paymentRequests.controller.ts
// FINAL — Payment Requests Admin (status drives order payment_status)
// - approve => orders.payment_status = 'paid' (+ optional orders.status)
// - uses db.transaction for atomicity
// - sets processedAt on terminal transitions
// - ROBUST: supports orders fields paymentStatus/payment_status, updatedAt/updated_at
// ===================================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, like, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { paymentRequests } from './schema';

// ✅ orders schema import (path sende farklıysa düzelt)
import { orders } from '@/modules/orders/schema';

// ---------- validations ----------
const listPaymentRequestsAdminQuery = z
  .object({
    user_id: z.string().uuid().optional(),
    order_id: z.string().uuid().optional(),
    status: z.string().optional(),
    limit: z.coerce.number().int().min(0).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    q: z.string().optional(),
    include: z.string().optional(),
  })
  .partial();

const updatePaymentRequestAdminBody = z.object({
  status: z.string().optional(),
  admin_note: z.string().nullable().optional(),
});

const setPaymentRequestStatusAdminBody = z.object({
  status: z.string(),
  admin_note: z.string().nullable().optional(),
});

// ---------- domain: allowed statuses ----------
const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'cancelled']);
const isTerminal = (s: string) => s === 'approved' || s === 'rejected' || s === 'cancelled';

// ---------- orders column resolver (robust) ----------
type OrdersAny = typeof orders & Record<string, any>;
const O = orders as unknown as OrdersAny;

const colPaymentStatus = (O.paymentStatus ?? O.payment_status) as any;
const colUpdatedAt = (O.updatedAt ?? O.updated_at) as any;
const colStatus = (O.status ?? O.orderStatus ?? O.order_status) as any;

// ---------- mapper ----------
const mapPaymentRequestAdmin = (r: typeof paymentRequests.$inferSelect) => ({
  id: r.id,
  order_id: r.orderId,
  user_id: r.userId ?? null,
  amount: Number(r.amount),
  currency: r.currency,
  status: r.status,
  admin_note: r.adminNotes ?? null,
  processed_at: r.processedAt ? String(r.processedAt) : null,
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
  orders: null,
});

// ---------- handlers ----------
export async function listPaymentRequestsAdminHandler(
  req: FastifyRequest<{
    Querystring: {
      user_id?: string;
      order_id?: string;
      status?: string;
      limit?: string;
      offset?: string;
      q?: string;
      include?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const parsed = listPaymentRequestsAdminQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { user_id, order_id, status, limit = 50, offset = 0, q } = parsed.data;

  const conds: SQL[] = [];
  if (user_id) conds.push(eq(paymentRequests.userId, user_id));
  if (order_id) conds.push(eq(paymentRequests.orderId, order_id));
  if (status) conds.push(eq(paymentRequests.status, status));
  if (q) conds.push(like(paymentRequests.id, `%${q}%`));

  const total =
    (
      await (conds.length
        ? db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentRequests)
            .where(and(...conds))
        : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentRequests))
    )[0]?.total ?? 0;

  const rows = conds.length
    ? await db
        .select()
        .from(paymentRequests)
        .where(and(...conds))
        .orderBy(desc(paymentRequests.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0))
    : await db
        .select()
        .from(paymentRequests)
        .orderBy(desc(paymentRequests.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0));

  const data = rows.map(mapPaymentRequestAdmin);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function getPaymentRequestAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, req.params.id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(row));
}

export async function updatePaymentRequestAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply,
) {
  const parsed = updatePaymentRequestAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { status, admin_note } = parsed.data;

  if (status !== undefined && !allowedStatuses.has(status)) {
    return reply.code(400).send({ error: { message: 'invalid_status' } });
  }

  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch['status'] = status;
  if (admin_note !== undefined) patch['adminNotes'] = admin_note;

  await db
    .update(paymentRequests)
    .set(patch as any)
    .where(eq(paymentRequests.id, req.params.id));

  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, req.params.id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(row));
}

export async function setPaymentRequestStatusAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply,
) {
  const parsed = setPaymentRequestStatusAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { status, admin_note } = parsed.data;

  if (!allowedStatuses.has(status)) {
    return reply.code(400).send({ error: { message: 'invalid_status' } });
  }

  const out = await db.transaction(async (tx) => {
    const [pr] = await tx
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, req.params.id))
      .limit(1);

    if (!pr) return null;

    const [ord] = await tx.select().from(orders).where(eq(orders.id, pr.orderId)).limit(1);
    if (!ord) throw new Error('order_not_found_for_payment_request');

    // update payment request
    await tx
      .update(paymentRequests)
      .set({
        status,
        adminNotes: admin_note ?? null,
        processedAt: isTerminal(status) ? (sql`CURRENT_TIMESTAMP(3)` as any) : null,
        updatedAt: sql`CURRENT_TIMESTAMP(3)` as any,
      } as any)
      .where(eq(paymentRequests.id, req.params.id));

    // drive order payment_status
    if (status === 'approved') {
      const patch: Record<string, unknown> = {};

      if (colPaymentStatus) patch[colPaymentStatus.name ?? 'payment_status'] = 'paid';
      if (colStatus && typeof (ord as any).status === 'string') {
        patch[colStatus.name ?? 'status'] =
          (ord as any).status === 'pending' ? 'processing' : (ord as any).status;
      }
      if (colUpdatedAt) patch[colUpdatedAt.name ?? 'updated_at'] = sql`CURRENT_TIMESTAMP(3)`;

      await tx
        .update(orders)
        .set(patch as any)
        .where(eq(orders.id, (ord as any).id));
    }

    if (status === 'rejected' || status === 'cancelled') {
      const patch: Record<string, unknown> = {};
      if (colPaymentStatus) patch[colPaymentStatus.name ?? 'payment_status'] = 'failed';
      if (colUpdatedAt) patch[colUpdatedAt.name ?? 'updated_at'] = sql`CURRENT_TIMESTAMP(3)`;

      await tx
        .update(orders)
        .set(patch as any)
        .where(eq(orders.id, (ord as any).id));
    }

    const [row] = await tx
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, req.params.id))
      .limit(1);

    return row ?? null;
  });

  if (!out) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(out));
}

export async function deletePaymentRequestAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await db.delete(paymentRequests).where(eq(paymentRequests.id, req.params.id));
  return reply.send({ success: true });
}
