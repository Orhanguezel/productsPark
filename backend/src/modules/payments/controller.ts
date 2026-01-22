// ===================================================================
// FILE: src/modules/payments/controller.ts
// FINAL — Payments module controllers (public)
// Security hardening:
// - PaymentRequests: auth-required (scoped to user)
// - PaymentSessions: NO public capture/cancel (prevent spoofing)
// - PaymentProviders: public, only expose public_config
// - Fix: Drizzle and(...) typing (SQL | undefined) handled safely
// ===================================================================

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
  PublicPaymentMethod,
  PublicPaymentMethodsResp,
  PaymentProviderType,
} from './types';

import { getSiteSettingsMap } from '@/modules/siteSettings/service';

// -------------------------- helpers --------------------------

const toDecimal = (x: unknown): string => toNum(x).toFixed(2);

// JSON helpers (string <-> object; no any)
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

const toJsonString = (v: unknown): string | null =>
  v == null ? null : JSON.stringify(v as JsonValue);

const parseJsonObject = (v: unknown): Record<string, unknown> | null => {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v);
      return typeof o === 'object' && o && !Array.isArray(o)
        ? (o as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
};

const asProviderType = (raw: unknown): PaymentProviderType => {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (s === 'wallet' || s === 'bank_transfer' || s === 'card' || s === 'manual') return s;
  return 'manual';
};

const toCommissionRate = (raw: unknown): number | undefined => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const toBoolLoose = (raw: unknown): boolean => {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on', 'enabled'].includes(s);
  }
  return false;
};

// Auth helper (project-wide auth decorator shape might differ)
type AuthUser = { id?: string } | undefined;

const getAuthUserId = (req: FastifyRequest): string | null => {
  const u = (req as unknown as { user?: AuthUser }).user;
  return u?.id ? String(u.id) : null;
};

// Drizzle typing helper: always returns SQL (never undefined)
const andAll = (conds: SQL[]): SQL => {
  // We deliberately only call and(...) when we have >= 2 conditions,
  // to avoid the "SQL | undefined" typing edge-case in some Drizzle versions.
  if (conds.length === 0) {
    // should never be used where conditions are mandatory
    // but returning a tautology keeps type stable.
    return sql`1=1`;
  }
  if (conds.length === 1) return conds[0];
  return and(...conds) as SQL;
};

// -------------------------- mappers --------------------------

const mapProvider = (r: typeof paymentProviders.$inferSelect): PaymentProvider => ({
  id: r.id,
  key: r.key,
  display_name: r.displayName,
  is_active: Boolean(r.isActive),
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
  admin_note: (r as unknown as { adminNote?: string | null }).adminNote ?? null,
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
  extra: parseJsonObject(r.extra),
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
});

// ===================================================================
// Handlers — Providers (public)
// ===================================================================

export async function listPaymentProvidersHandler(
  req: FastifyRequest<{ Querystring: { is_active?: string } }>,
  reply: FastifyReply,
) {
  const parsed = listProvidersQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const active = toBool(parsed.data.is_active);

  const rows =
    typeof active === 'boolean'
      ? await db
          .select()
          .from(paymentProviders)
          .where(eq(paymentProviders.isActive, active ? 1 : 0))
      : await db.select().from(paymentProviders).where(eq(paymentProviders.isActive, 1));

  const data = rows.map(mapProvider);

  reply.header('x-total-count', String(data.length));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, 0, data.length || 0, data.length);
  return reply.send(data);
}

export async function getPaymentProviderByKeyHandler(
  req: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply,
) {
  const conds: SQL[] = [eq(paymentProviders.key, req.params.key), eq(paymentProviders.isActive, 1)];

  const [r] = await db.select().from(paymentProviders).where(andAll(conds)).limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProvider(r));
}

// ===================================================================
// Handlers — Payment Requests (AUTH REQUIRED, scoped to user)
// ===================================================================

export async function listPaymentRequestsHandler(
  req: FastifyRequest<{
    Querystring: {
      user_id?: string;
      order_id?: string;
      status?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return reply.code(401).send({ error: { message: 'unauthorized' } });
  }

  const parsed = listPaymentRequestsQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { order_id, status, limit = 50, offset = 0 } = parsed.data;

  // SECURITY: ignore user_id from query, enforce user scope
  const conds: SQL[] = [eq(paymentRequests.userId, userId)];
  if (order_id) conds.push(eq(paymentRequests.orderId, order_id));
  if (status) conds.push(eq(paymentRequests.status, status));

  const whereExpr = andAll(conds);

  const totalRow = await db
    .select({ total: sql<number>`COUNT(*)`.as('total') })
    .from(paymentRequests)
    .where(whereExpr);

  const total = totalRow[0]?.total ?? 0;

  const rows = await db
    .select()
    .from(paymentRequests)
    .where(whereExpr)
    .orderBy(desc(paymentRequests.createdAt))
    .limit(Math.min(limit, 100))
    .offset(Math.max(offset, 0));

  const data = rows.map(mapPaymentReq);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function getPaymentRequestByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return reply.code(401).send({ error: { message: 'unauthorized' } });
  }

  const conds: SQL[] = [eq(paymentRequests.id, req.params.id), eq(paymentRequests.userId, userId)];

  const [r] = await db.select().from(paymentRequests).where(andAll(conds)).limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentReq(r));
}

export async function createPaymentRequestHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return reply.code(401).send({ error: { message: 'unauthorized' } });
  }

  const parsed = createPaymentRequestBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const b = parsed.data;
  const id = b.id ?? crypto.randomUUID();

  // Provider validation: must exist & active
  const provConds: SQL[] = [
    eq(paymentProviders.key, b.payment_method),
    eq(paymentProviders.isActive, 1),
  ];
  const [prov] = await db.select().from(paymentProviders).where(andAll(provConds)).limit(1);

  if (!prov) {
    return reply.code(400).send({ error: { message: 'invalid_payment_method' } });
  }

  await db.insert(paymentRequests).values({
    id,
    orderId: b.order_id,
    userId, // SECURITY
    amount: toDecimal(b.amount),
    currency: b.currency ?? 'TRY',
    paymentMethod: b.payment_method,
    paymentProof: b.proof_image_url ?? null,
    status: b.status,
    adminNote: (b as unknown as { admin_note?: string | null }).admin_note ?? null,
    processedAt: b.processed_at ? new Date(b.processed_at) : null,
  } as unknown as typeof paymentRequests.$inferInsert);

  const outConds: SQL[] = [eq(paymentRequests.id, id), eq(paymentRequests.userId, userId)];
  const [row] = await db.select().from(paymentRequests).where(andAll(outConds)).limit(1);

  return reply.code(201).send(row ? mapPaymentReq(row) : null);
}

export async function deletePaymentRequestHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = getAuthUserId(req);
  if (!userId) {
    return reply.code(401).send({ error: { message: 'unauthorized' } });
  }

  const conds: SQL[] = [eq(paymentRequests.id, req.params.id), eq(paymentRequests.userId, userId)];

  const [exists] = await db
    .select({ id: paymentRequests.id })
    .from(paymentRequests)
    .where(andAll(conds))
    .limit(1);

  if (!exists) return reply.code(404).send({ success: false });

  await db.delete(paymentRequests).where(andAll(conds));
  return reply.send({ success: true });
}

// ===================================================================
// Handlers — Payment Sessions (public)
// NOTE: capture/cancel must NOT be public.
// ===================================================================

export async function createPaymentSessionHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
) {
  const parsed = createPaymentSessionBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const body = parsed.data;

  const provConds: SQL[] = [
    eq(paymentProviders.key, body.provider_key),
    eq(paymentProviders.isActive, 1),
  ];
  const [prov] = await db.select().from(paymentProviders).where(andAll(provConds)).limit(1);

  if (!prov) {
    return reply.code(400).send({ error: { message: 'invalid_payment_method' } });
  }

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
    extra: toJsonString(body.meta ?? null),
  });

  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, id)).limit(1);

  return reply.code(201).send(mapSession(row));
}

export async function getPaymentSessionByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const [r] = await db
    .select()
    .from(paymentSessions)
    .where(eq(paymentSessions.id, req.params.id))
    .limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapSession(r));
}

// ===================================================================
// Public Payment Methods (aggregate)
// ===================================================================

export async function getPublicPaymentMethodsHandler(req: FastifyRequest, reply: FastifyReply) {
  const providers = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.isActive, 1))
    .orderBy(paymentProviders.displayName);

  const keys = ['default_currency', 'guest_order_enabled'] as const;
  const map = await getSiteSettingsMap(keys);

  const currencyRaw = map.get('default_currency');
  const currency = currencyRaw && currencyRaw.trim() ? currencyRaw.trim() : 'TRY';

  const guest_order_enabled = toBoolLoose(map.get('guest_order_enabled'));

  const methods: PublicPaymentMethod[] = providers.map((p) => {
    const cfg = parseJsonObject(p.publicConfig) ?? null;
    const type = asProviderType(cfg?.type);
    const commission_rate = toCommissionRate(cfg?.commission);

    const out: PublicPaymentMethod = {
      key: p.key,
      display_name: p.displayName,
      type,
      enabled: Boolean(p.isActive),
      config: cfg,
    };

    if (commission_rate !== undefined) out.commission_rate = commission_rate;
    return out;
  });

  const resp: PublicPaymentMethodsResp = {
    currency,
    guest_order_enabled,
    methods,
  };

  return reply.send(resp);
}
