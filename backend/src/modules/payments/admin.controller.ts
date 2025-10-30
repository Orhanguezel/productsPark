// src/modules/payments/admin.controller.ts
import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, desc, eq, gte, lte, like, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import {
  paymentProviders,
  paymentRequests,
  paymentSessions,
  payments,
  paymentEvents,
} from './schema';

// ---------- helpers ----------
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

// nullable LIKE helper — Drizzle type-safe
const likeNullable = (col: unknown, pattern: string): SQL =>
  sql`${col} IS NOT NULL AND ${col} LIKE ${pattern}`;


const toNum = (x: unknown): number => {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    const n = Number(x.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return Number(x ?? 0);
};
const toDecimal = (x: unknown): string => toNum(x).toFixed(2);
const toJsonString = (v: unknown): string | null => (v == null ? null : JSON.stringify(v as JsonValue));
const parseJsonObject = (v: unknown): Record<string, unknown> | null => {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v);
      return typeof o === 'object' && o && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
    } catch { return null; }
  }
  return null;
};

function isDupErr(e: unknown) {
  const msg = String((e as any)?.message ?? '');
  const code = (e as any)?.code;
  return code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(msg);
}
function hasNoSecretCol(e: unknown) {
  const msg = String((e as any)?.message ?? '');
  return /Unknown column 'secret_config'/i.test(msg);
}

// ---------- validations ----------
const listProvidersAdminQuery = z.object({
  is_active: z.union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')]).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).partial();

const updateProviderAdminBody = z.object({
  key: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
  is_active: z.union([z.boolean(), z.literal(0), z.literal(1), z.literal('0'), z.literal('1'), z.literal('true'), z.literal('false')]).optional(),
  public_config: z.record(z.unknown()).nullable().optional(),
  secret_config: z.record(z.unknown()).nullable().optional(),
});

const createProviderAdminBody = updateProviderAdminBody.extend({
  key: z.string().min(1),
  display_name: z.string().min(1),
}).required({ key: true, display_name: true });

const listPaymentRequestsAdminQuery = z.object({
  user_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().optional(),
  include: z.string().optional(),
}).partial();

const updatePaymentRequestAdminBody = z.object({
  status: z.string().optional(),
  admin_note: z.string().nullable().optional(),
});

const setPaymentRequestStatusAdminBody = z.object({
  status: z.string(),
  admin_note: z.string().nullable().optional(),
});

const listPaymentSessionsAdminQuery = z.object({
  order_id: z.string().uuid().optional(),
  provider_key: z.string().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
}).partial();

const createPaymentSessionAdminBody = z.object({
  provider_key: z.string().min(1),
  order_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1).default('TRY'),
  status: z.string().min(1).default('pending'),
  extra: z.record(z.unknown()).nullable().optional(),
});

const listPaymentsAdminQuery = z.object({
  q: z.string().optional(),
  provider: z.string().optional(),
  status: z.string().optional(),
  order_id: z.string().uuid().optional(),
  is_test: z.union([z.boolean(), z.literal(0), z.literal(1), z.literal('0'), z.literal('1'), z.literal('true'), z.literal('false')]).optional(),
  min_amount: z.coerce.number().optional(),
  max_amount: z.coerce.number().optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(0).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['created_at','updated_at','amount_captured','amount_authorized','status']).optional(),
  order: z.enum(['asc','desc']).optional(),
  include: z.string().optional(),
}).partial();

const capturePaymentBody = z.object({
  amount: z.coerce.number().positive().optional(),
  idempotency_key: z.string().optional(),
}).partial();

const refundPaymentBody = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().optional(),
}).partial();

const voidPaymentBody = z.object({
  reason: z.string().optional(),
}).partial();

// ---------- mappers ----------
const mapProviderAdmin = (r: typeof paymentProviders.$inferSelect) => ({
  id: r.id,
  key: r.key,
  display_name: r.displayName,
  is_active: Boolean(r.isActive),
  public_config: parseJsonObject(r.publicConfig),
  secret_config: parseJsonObject((r as any).secretConfig),
});

const mapPaymentRequestAdmin = (r: typeof paymentRequests.$inferSelect) => ({
  id: r.id,
  order_id: r.orderId,
  user_id: r.userId ?? null,
  amount: Number(r.amount),
  currency: r.currency,
  status: r.status,
  admin_note: r.adminNotes ?? null,
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  orders: null,
});

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

// ---------- providers (admin) ----------
export async function listPaymentProvidersAdminHandler(
  req: FastifyRequest<{ Querystring: { is_active?: string; q?: string; limit?: string; offset?: string } }>,
  reply: FastifyReply
) {
  const parsed = listProvidersAdminQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { is_active, q, limit = 200, offset = 0 } = parsed.data;
  const active =
    is_active === '1' || is_active === 'true'
      ? 1
      : is_active === '0' || is_active === 'false'
      ? 0
      : undefined;

  const conds: SQL[] = [];
  if (active !== undefined) conds.push(eq(paymentProviders.isActive, active));
  if (q) {
    const pat = `%${q}%`;
    conds.push(like(paymentProviders.displayName, pat));
  }

  const total = (await (conds.length
    ? db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentProviders).where(and(...conds))
    : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentProviders)))[0]?.total ?? 0;

  const rows = conds.length
    ? await db.select().from(paymentProviders).where(and(...conds)).orderBy(paymentProviders.displayName).limit(Math.min(limit, 200)).offset(Math.max(offset, 0))
    : await db.select().from(paymentProviders).orderBy(paymentProviders.displayName).limit(Math.min(limit, 200)).offset(Math.max(offset, 0));

  const data = rows.map(mapProviderAdmin);
  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function getPaymentProviderAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [r] = await db.select().from(paymentProviders).where(eq(paymentProviders.id, req.params.id)).limit(1);
  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProviderAdmin(r));
}

export async function createPaymentProviderAdminHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createProviderAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const b = parsed.data;
  const id = crypto.randomUUID();
  const isActive = (b.is_active === true || b.is_active === 1 || b.is_active === '1' || b.is_active === 'true') ? 1 : 0;

  // Tek satır kaynağı
  const row = {
    id,
    key: b.key,
    displayName: b.display_name,
    isActive,
    publicConfig: toJsonString(b.public_config ?? null),
    secretConfig: toJsonString(b.secret_config ?? null),
  } as typeof paymentProviders.$inferInsert;

  try {
    // Normal yol: insert (varsa aynı key'e upsert)
    await db
      .insert(paymentProviders)
      .values(row)
      .onDuplicateKeyUpdate({
        // duplicate `key` durumunda şu alanları güncelle
        set: {
          displayName: row.displayName,
          isActive: row.isActive,
          publicConfig: row.publicConfig,
          // tablo kolonu mevcutsa set et
          ...(typeof (paymentProviders as any).secretConfig !== 'undefined'
            ? { secretConfig: row.secretConfig }
            : {}),
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });
  } catch (e) {
    // Eski şema: secret_config yoksa kolonsuz tekrar dene
    if (hasNoSecretCol(e)) {
      const { secretConfig, ...withoutSecret } = row;
      await db
        .insert(paymentProviders)
        .values(withoutSecret as any)
        .onDuplicateKeyUpdate({
          set: {
            displayName: row.displayName,
            isActive: row.isActive,
            publicConfig: row.publicConfig,
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
          },
        });
    } else if (isDupErr(e)) {
      // Güvenli yanıt: 409 döndürmek istersen bu blokta döndürebilirsin.
      // return reply.code(409).send({ error: { message: 'key_already_exists' } });
      // Ancak yukarıdaki upsert zaten güncellemiş olacağından normal akışa bırakıyoruz.
    } else {
      throw e;
    }
  }

  // En güncel kaydı döndür
  const [out] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.key, b.key))
    .limit(1);

  return reply.code(201).send(mapProviderAdmin(out));
}

export async function updatePaymentProviderAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = updateProviderAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const b = parsed.data;
  const patch: Record<string, unknown> = {};
  if (b.key) patch['key'] = b.key;
  if (b.display_name) patch['displayName'] = b.display_name;
  if (b.is_active !== undefined) {
    patch['isActive'] = (b.is_active === true || b.is_active === 1 || b.is_active === '1' || b.is_active === 'true') ? 1 : 0;
  }
  if (b.public_config !== undefined) patch['publicConfig'] = toJsonString(b.public_config);
  if (b.secret_config !== undefined && typeof (paymentProviders as any).secretConfig !== 'undefined') {
    patch['secretConfig'] = toJsonString(b.secret_config);
  }

  await db.update(paymentProviders).set(patch as any).where(eq(paymentProviders.id, req.params.id));
  const [row] = await db.select().from(paymentProviders).where(eq(paymentProviders.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProviderAdmin(row));
}

export async function deletePaymentProviderAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await db.delete(paymentProviders).where(eq(paymentProviders.id, req.params.id));
  return reply.send({ success: true });
}

// ---------- payment requests (admin) ----------
export async function listPaymentRequestsAdminHandler(
  req: FastifyRequest<{ Querystring: { user_id?: string; order_id?: string; status?: string; limit?: string; offset?: string; q?: string; include?: string } }>,
  reply: FastifyReply
) {
  const parsed = listPaymentRequestsAdminQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { user_id, order_id, status, limit = 50, offset = 0, q } = parsed.data;

  const conds: SQL[] = [];
  if (user_id) conds.push(eq(paymentRequests.userId, user_id));
  if (order_id) conds.push(eq(paymentRequests.orderId, order_id));
  if (status) conds.push(eq(paymentRequests.status, status));
  if (q) {
    const pat = `%${q}%`;
    conds.push(like(paymentRequests.id, pat));
  }

  const total = (await (conds.length
    ? db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentRequests).where(and(...conds))
    : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentRequests)))[0]?.total ?? 0;

  const rows = conds.length
    ? await db.select().from(paymentRequests).where(and(...conds)).orderBy(desc(paymentRequests.createdAt)).limit(Math.min(limit, 100)).offset(Math.max(offset, 0))
    : await db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt)).limit(Math.min(limit, 100)).offset(Math.max(offset, 0));

  const data = rows.map(mapPaymentRequestAdmin);
  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function getPaymentRequestAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(row));
}

export async function updatePaymentRequestAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = updatePaymentRequestAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { status, admin_note } = parsed.data;
  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch['status'] = status;
  if (admin_note !== undefined) patch['adminNotes'] = admin_note;

  await db.update(paymentRequests).set(patch as any).where(eq(paymentRequests.id, req.params.id));
  const [row] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(row));
}

export async function setPaymentRequestStatusAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = setPaymentRequestStatusAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { status, admin_note } = parsed.data;
  await db.update(paymentRequests).set({ status, adminNotes: admin_note ?? null } as any).where(eq(paymentRequests.id, req.params.id));
  const [row] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentRequestAdmin(row));
}

export async function deletePaymentRequestAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await db.delete(paymentRequests).where(eq(paymentRequests.id, req.params.id));
  return reply.send({ success: true });
}

// ---------- payment sessions (admin) ----------
// ---------- payment sessions (admin) ----------
export async function listPaymentSessionsAdminHandler(
  req: FastifyRequest<{ Querystring: { order_id?: string; provider_key?: string; status?: string; q?: string; limit?: string; offset?: string } }>,
  reply: FastifyReply
) {
  const parsed = listPaymentSessionsAdminQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { order_id, provider_key, status, q, limit = 50, offset = 0 } = parsed.data;

  const conds: SQL[] = [];
  if (order_id)   conds.push(eq(paymentSessions.orderId, order_id));
  if (provider_key) conds.push(eq(paymentSessions.providerKey, provider_key));
  if (status)     conds.push(eq(paymentSessions.status, status));
  if (q) {
    const pat = `%${q}%`;
    conds.push(
      sql`(
        COALESCE(${paymentSessions.id}, '')          LIKE ${pat}
        OR COALESCE(${paymentSessions.providerKey}, '') LIKE ${pat}
        OR COALESCE(${paymentSessions.orderId}, '')  LIKE ${pat}
      )`
    );
  }

  const total = (await (conds.length
    ? db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentSessions).where(and(...conds))
    : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentSessions)))[0]?.total ?? 0;

  const rows = conds.length
    ? await db.select().from(paymentSessions).where(and(...conds))
        .orderBy(desc(paymentSessions.createdAt))
        .limit(Math.min(limit, 100)).offset(Math.max(offset, 0))
    : await db.select().from(paymentSessions)
        .orderBy(desc(paymentSessions.createdAt))
        .limit(Math.min(limit, 100)).offset(Math.max(offset, 0));

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
  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapSessionAdmin(row));
}

export async function createPaymentSessionAdminHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createPaymentSessionAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

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

  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, id)).limit(1);
  return reply.code(201).send(mapSessionAdmin(row));
}


export async function capturePaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ success: false, status: 'failed' });
  await db.update(paymentSessions).set({ status: 'captured', updatedAt: sql`CURRENT_TIMESTAMP(3)` }).where(eq(paymentSessions.id, req.params.id));
  return reply.send({ success: true, status: 'captured' });
}

export async function cancelPaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ success: false });
  await db.update(paymentSessions).set({ status: 'cancelled', updatedAt: sql`CURRENT_TIMESTAMP(3)` }).where(eq(paymentSessions.id, req.params.id));
  return reply.send({ success: true });
}

export async function syncPaymentSessionAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ success: false });
  return reply.send({ success: true, status: row.status as string });
}

// ---------- payments (admin) ----------
export async function listPaymentsAdminHandler(
  req: FastifyRequest<{ Querystring: {
    q?: string; provider?: string; status?: string; order_id?: string; is_test?: string | number | boolean;
    min_amount?: string | number; max_amount?: string | number; starts_at?: string; ends_at?: string;
    limit?: string; offset?: string; sort?: string; order?: 'asc' | 'desc'; include?: string;
  } }>,
  reply: FastifyReply
) {
  const parsed = listPaymentsAdminQuery.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const { q, provider, status, order_id, is_test, min_amount, max_amount, starts_at, ends_at,
          limit = 50, offset = 0, sort = 'created_at', order = 'desc' } = parsed.data;

  const conds: SQL[] = [];
  if (provider) conds.push(eq(payments.provider, provider));
  if (status)   conds.push(eq(payments.status, status));
  if (order_id) conds.push(eq(payments.orderId, order_id));
  if (typeof is_test !== 'undefined') {
    const flag = (is_test === true || is_test === 1 || is_test === '1' || is_test === 'true') ? 1 : 0;
    conds.push(eq(payments.isTest, flag as any));
  }
  if (min_amount != null) conds.push(gte(payments.amountAuthorized, toDecimal(min_amount) as any));
  if (max_amount != null) conds.push(lte(payments.amountAuthorized, toDecimal(max_amount) as any));
  if (starts_at) conds.push(gte(payments.createdAt, new Date(starts_at) as any));
  if (ends_at)   conds.push(lte(payments.createdAt, new Date(ends_at) as any));

  if (q) {
    const pat = `%${q}%`;
    conds.push(
      sql`(
        COALESCE(${payments.reference}, '')     LIKE ${pat}
        OR COALESCE(${payments.transactionId}, '') LIKE ${pat}
      )`
    );
  }

  const whereSql = conds.length ? and(...conds) : undefined;

  const total = (await (whereSql
    ? db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(payments).where(whereSql)
    : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(payments)))[0]?.total ?? 0;

  const orderByExpr =
    sort === 'updated_at'        ? (order === 'asc' ? (payments.updatedAt as any)        : desc(payments.updatedAt)) :
    sort === 'amount_captured'   ? (order === 'asc' ? (payments.amountCaptured as any)   : desc(payments.amountCaptured)) :
    sort === 'amount_authorized' ? (order === 'asc' ? (payments.amountAuthorized as any) : desc(payments.amountAuthorized)) :
    sort === 'status'            ? (order === 'asc' ? (payments.status as any)           : desc(payments.status)) :
                                   (order === 'asc' ? (payments.createdAt as any)        : desc(payments.createdAt));

  const rows = whereSql
    ? await db.select().from(payments).where(whereSql).orderBy(orderByExpr).limit(Math.min(limit, 100)).offset(Math.max(offset, 0))
    : await db.select().from(payments).orderBy(orderByExpr).limit(Math.min(limit, 100)).offset(Math.max(offset, 0));

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
  const [row] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentAdmin(row));
}

export async function capturePaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = capturePaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const [row] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  const currentCaptured = Number(row.amountCaptured);
  const maxCapture = Number(row.amountAuthorized) - currentCaptured;
  const amount = parsed.data.amount != null ? Math.min(parsed.data.amount, maxCapture) : maxCapture;

  await db.update(payments).set({
    amountCaptured: toDecimal(currentCaptured + amount) as any,
    status: (currentCaptured + amount) >= Number(row.amountAuthorized) ? 'captured' : row.status,
    updatedAt: sql`CURRENT_TIMESTAMP(3)`,
  }).where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'capture',
    message: `Captured ${amount}`,
    raw: toJsonString({ amount }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  return reply.send(mapPaymentAdmin(updated));
}

export async function refundPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = refundPaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const [row] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  const currentRefunded = Number(row.amountRefunded);
  const refundable = Number(row.amountCaptured) - currentRefunded;
  const amount = parsed.data.amount != null ? Math.min(parsed.data.amount, refundable) : refundable;

  const newRefunded = currentRefunded + amount;
  const newStatus =
    newRefunded <= 0 ? row.status :
    (newRefunded < Number(row.amountCaptured) ? 'partially_refunded' : 'refunded');

  await db.update(payments).set({
    amountRefunded: toDecimal(newRefunded) as any,
    status: newStatus,
    updatedAt: sql`CURRENT_TIMESTAMP(3)`,
  }).where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'refund',
    message: `Refunded ${amount}${parsed.data.reason ? ` | reason: ${parsed.data.reason}` : ''}`,
    raw: toJsonString({ amount, reason: parsed.data.reason ?? null }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  return reply.send(mapPaymentAdmin(updated));
}

export async function voidPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = voidPaymentBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'validation_error', details: parsed.error.format() } });

  const [row] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.update(payments).set({
    status: 'voided',
    updatedAt: sql`CURRENT_TIMESTAMP(3)`,
  }).where(eq(payments.id, req.params.id));

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'void',
    message: `Voided${(parsed.data as any)?.reason ? ` | reason: ${(parsed.data as any).reason}` : ''}`,
    raw: toJsonString({ reason: (parsed.data as any)?.reason ?? null }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  return reply.send(mapPaymentAdmin(updated));
}

export async function syncPaymentAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [row] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.insert(paymentEvents).values({
    id: crypto.randomUUID(),
    paymentId: req.params.id,
    eventType: 'sync',
    message: 'Manual sync',
    raw: toJsonString({ ok: true }),
    createdAt: sql`CURRENT_TIMESTAMP(3)` as any,
  });

  const [updated] = await db.select().from(payments).where(eq(payments.id, req.params.id)).limit(1);
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
