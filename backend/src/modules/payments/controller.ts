import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { paymentProviders, paymentRequests, paymentSessions } from './schema';
import {
  listProvidersQuery,
  listPaymentRequestsQuery,
  createPaymentRequestBody,
  createPaymentSessionBody,
  toBool,
  toNum,
} from './validation';
import type {
  ApiPaymentRequest,
  PaymentProvider,
  PaymentSession as PaymentSessionDTO,
  PaymentSessionStatus,
} from './types';

// DECIMAL insert helper (drizzle DECIMAL insert = string)
const toDecimal = (x: unknown): string => toNum(x).toFixed(2);

// JSON helpers (string <-> object; any yok)
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

const toJsonString = (v: unknown): string | null =>
  v == null ? null : JSON.stringify(v as JsonValue);

const parseJsonObject = (v: unknown): Record<string, unknown> | null => {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v);
      return typeof o === 'object' && o && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
};

// ──────────────── mappers ────────────────
const mapProvider = (r: typeof paymentProviders.$inferSelect): PaymentProvider => ({
  id: r.id,
  key: r.key,
  display_name: r.displayName,
  is_active: Boolean(r.isActive),
  // TEXT -> object
  public_config: parseJsonObject(r.publicConfig),
});

const mapPaymentReq = (r: typeof paymentRequests.$inferSelect): ApiPaymentRequest => ({
  id: r.id,
  order_id: r.orderId,
  user_id: r.userId ?? null,
  amount: Number(r.amount),
  currency: r.currency,
  payment_method: r.paymentMethod,
  proof_image_url: r.paymentProof ?? null,
  status: r.status as ApiPaymentRequest['status'],
  admin_notes: r.adminNotes ?? null,
  processed_at: r.processedAt ? String(r.processedAt) : null,
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
});

const mapSession = (r: typeof paymentSessions.$inferSelect): PaymentSessionDTO => ({
  id: r.id,
  provider_key: r.providerKey,
  order_id: r.orderId ?? null,
  amount: Number(r.amount),
  currency: r.currency,
  status: r.status as PaymentSessionStatus,
  client_secret: r.clientSecret ?? null,
  iframe_url: r.iframeUrl ?? null,
  redirect_url: r.redirectUrl ?? null,
  // TEXT -> object
  extra: parseJsonObject(r.extra),
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
});

// ──────────────── handlers ────────────────
export async function listPaymentProvidersHandler(
  req: FastifyRequest<{ Querystring: { is_active?: string } }>,
  reply: FastifyReply
) {
  const parsed = listProvidersQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const active = toBool(parsed.data.is_active);

  const rows =
    typeof active === 'boolean'
      ? await db
          .select()
          .from(paymentProviders)
          .where(eq(paymentProviders.isActive, active ? 1 : 0))
      : await db.select().from(paymentProviders);

  const data = rows.map(mapProvider);

  reply.header('x-total-count', String(data.length));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, 0, data.length || 0, data.length);
  return reply.send(data);
}

export async function getPaymentProviderByKeyHandler(
  req: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
) {
  const rows = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.key, req.params.key))
    .limit(1);

  const r = rows[0];
  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProvider(r));
}

export async function listPaymentRequestsHandler(
  req: FastifyRequest<{
    Querystring: { user_id?: string; order_id?: string; status?: string; limit?: string; offset?: string };
  }>,
  reply: FastifyReply
) {
  const parsed = listPaymentRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { user_id, order_id, status, limit = 50, offset = 0 } = parsed.data;

  const conds: SQL[] = [];
  if (user_id) conds.push(eq(paymentRequests.userId, user_id));
  if (order_id) conds.push(eq(paymentRequests.orderId, order_id));
  if (status) conds.push(eq(paymentRequests.status, status));

  const whereExpr: SQL | undefined = conds.length ? and(...conds) : undefined;

  const totalRow = whereExpr
    ? await db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentRequests).where(whereExpr)
    : await db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentRequests);

  const total = totalRow[0]?.total ?? 0;

  const rows = whereExpr
    ? await db
        .select()
        .from(paymentRequests)
        .where(whereExpr)
        .orderBy(desc(paymentRequests.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0))
    : await db
        .select()
        .from(paymentRequests)
        .orderBy(desc(paymentRequests.createdAt))
        .limit(Math.min(limit, 100))
        .offset(Math.max(offset, 0));

  const data = rows.map(mapPaymentReq);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function createPaymentSessionHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createPaymentSessionBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const body = parsed.data;
  const id = crypto.randomUUID();

  await db.insert(paymentSessions).values({
    id,
    providerKey: body.provider_key,
    orderId: body.order_id ?? null,
    amount: toDecimal(body.amount),
    currency: body.currency,
    status: 'pending',
    clientSecret: null,
    iframeUrl: null,
    redirectUrl: null,
    // TEXT'e JSON string yaz
    extra: toJsonString(body.meta ?? null),
  });

  const [row] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, id))
    .limit(1);

  return reply.code(201).send(mapSession(row));
}

export async function getPaymentSessionByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const rows = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  const r = rows[0];
  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapSession(r));
}

export async function capturePaymentSessionHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const rows = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!rows[0]) {
    return reply.code(404).send({ success: false, status: 'failed' as PaymentSessionStatus });
  }

  await db.update(paymentSessions).set({ status: 'captured' }).where(eq(paymentSessions.id, req.params.id));
  return reply.send({ success: true, status: 'captured' as PaymentSessionStatus });
}

export async function cancelPaymentSessionHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const rows = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!rows[0]) return reply.code(404).send({ success: false });

  await db.update(paymentSessions).set({ status: 'cancelled' }).where(eq(paymentSessions.id, req.params.id));
  return reply.send({ success: true });
}

// ── Eksik export yüzünden yaşanan "named export not found" hatasını da giderir:
export async function createPaymentRequestHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createPaymentRequestBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const b = parsed.data;
  const id = b.id ?? crypto.randomUUID();

  await db.insert(paymentRequests).values({
    id,
    orderId: b.order_id,
    userId: b.user_id ?? null,
    amount: toDecimal(b.amount),
    currency: b.currency ?? 'TRY',
    paymentMethod: b.payment_method,
    paymentProof: b.proof_image_url ?? null,
    status: b.status,
    adminNotes: b.admin_notes ?? null,
    processedAt: b.processed_at ? new Date(b.processed_at) : null,
  });

  const [row] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, id))
    .limit(1);

  return reply.code(201).send(row ? mapPaymentReq(row) : null);
}
