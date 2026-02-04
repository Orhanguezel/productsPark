// ===================================================================
// FILE: src/modules/payments/controller.ts
// FINAL — Payments controllers (public providers + auth payment_requests + public sessions)
// Fixes (PayTR):
// - ✅ basket TL/kuruş normalize (FE kuruş yollasa bile TL stringe çevirir)
// - ✅ basket total vs payment_amount mismatch -> kontrollü "denge satırı" ekler
// - ✅ orderId PayTR merchant_oid ile aynı tutulur (notify matching)
// - ✅ lang opsiyonel (göndermezsen hiç forward etmez)
// ===================================================================

import crypto from 'crypto';
import type { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

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
import { createPaytrToken } from '@/modules/functions/paytr/service';
import { createShopierForm } from '@/modules/functions/shopier/service';

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

const getClientIp = (req: FastifyRequest): string => {
  const xfRaw = req.headers['x-forwarded-for'];
  const xf = typeof xfRaw === 'string' ? xfRaw : Array.isArray(xfRaw) ? xfRaw.join(',') : '';
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  const ip = (req.ip ?? '').trim();
  return ip || '127.0.0.1';
};

const isPrivateOrLoopback = (ip: string): boolean => {
  const s = String(ip ?? '').trim();
  if (!s) return true;
  if (s === '127.0.0.1' || s === '::1') return true;
  if (s.startsWith('10.')) return true;
  if (s.startsWith('192.168.')) return true;
  if (s.startsWith('172.')) {
    const p = s.split('.');
    const n = Number(p[1]);
    if (Number.isFinite(n) && n >= 16 && n <= 31) return true;
  }
  return false;
};

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function toStr(v: unknown, fallback = ''): string {
  const s = typeof v === 'string' ? v : String(v ?? '');
  const t = s.trim();
  return t.length ? t : fallback;
}
function toMoney2(v: unknown): string {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? Number(v.replace(',', '.').trim())
        : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function splitName(full: string): { first: string; last: string } {
  const parts = full
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0] ?? '', last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts.slice(-1)[0] ?? '' };
}

// PayTR basket types
type PaytrBasketItem = [string, number | string, number | string];

/**
 * Normalize basket into PayTR-friendly TL strings:
 * - unit_price SHOULD be TL (e.g. "10000.00")
 * - if unit_price looks like kuruş (very large), divide by 100
 */
const normalizePaytrBasketTL = (v: unknown): Array<[string, string, number]> => {
  if (!Array.isArray(v)) return [];

  const out: Array<[string, string, number]> = [];

  for (const row of v) {
    if (!Array.isArray(row)) continue;

    const name = typeof row[0] === 'string' ? row[0].trim() : '';
    if (!name) continue;

    const unitRaw = row[1];
    const qtyRaw = row[2];

    const qty = Math.max(1, toInt(qtyRaw, 1));

    const unitNum =
      typeof unitRaw === 'number'
        ? unitRaw
        : typeof unitRaw === 'string'
          ? Number(unitRaw.replace(',', '.').trim())
          : Number(String(unitRaw ?? '').trim());

    // heuristic threshold: 100000 => 1000.00 TL (kuruş-style)
    const unitTL = Number.isFinite(unitNum)
      ? (unitNum >= 100000 ? unitNum / 100 : unitNum).toFixed(2)
      : '0.00';

    out.push([name, unitTL, qty]);
  }

  return out.filter((x) => x[0] && x[2] > 0);
};

const sumBasketTL = (basket: Array<[string, string, number]>): number => {
  let total = 0;
  for (const [, unitStr, qty] of basket) {
    const unit = Number(unitStr);
    if (!Number.isFinite(unit)) continue;
    total += unit * qty;
  }
  return total;
};

// -------------------------- AUTH --------------------------

const UUID = z.string().uuid();
type AuthUserLike = { sub?: unknown; id?: unknown; userId?: unknown };

const getAuthUserId = (req: FastifyRequest): string | null => {
  const u = (req as unknown as { user?: AuthUserLike }).user;
  const raw = u?.sub ?? u?.id ?? u?.userId ?? null;
  const id = String(raw ?? '').trim();
  if (!id) return null;
  const parsed = UUID.safeParse(id);
  return parsed.success ? parsed.data : null;
};

// Drizzle typing helper: always returns SQL (never undefined)
const andAll = (conds: SQL[]): SQL => {
  if (conds.length === 0) return sql`1=1`;
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
  extra: parseJsonObject(r.extra),
  created_at: r.createdAt ? String(r.createdAt) : undefined,
  updated_at: r.updatedAt ? String(r.updatedAt) : undefined,
});

// ===================================================================
// Providers (public)
// ===================================================================

export const listPaymentProvidersHandler: RouteHandlerMethod = async (req, reply) => {
  const parsed = listProvidersQuery.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
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
};

export const getPaymentProviderByKeyHandler: RouteHandlerMethod = async (req, reply) => {
  const key = String((req as any).params?.key ?? '').trim();
  const conds: SQL[] = [eq(paymentProviders.key, key), eq(paymentProviders.isActive, 1)];
  const [r] = await db.select().from(paymentProviders).where(andAll(conds)).limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProvider(r));
};

// ===================================================================
// Payment Requests (AUTH REQUIRED, scoped to user)
// ===================================================================

export const listPaymentRequestsHandler: RouteHandlerMethod = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const parsed = listPaymentRequestsQuery.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const { order_id, status, limit = 50, offset = 0 } = parsed.data;

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
    .limit(Math.min(Number(limit), 100))
    .offset(Math.max(Number(offset), 0));

  const data = rows.map(mapPaymentReq);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, Number(offset), Number(limit), total);
  return reply.send(data);
};

export const getPaymentRequestByIdHandler: RouteHandlerMethod = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const id = String((req as any).params?.id ?? '').trim();
  const conds: SQL[] = [eq(paymentRequests.id, id), eq(paymentRequests.userId, userId)];
  const [r] = await db.select().from(paymentRequests).where(andAll(conds)).limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapPaymentReq(r));
};

export const createPaymentRequestHandler: RouteHandlerMethod = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const parsed = createPaymentRequestBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const b = parsed.data;
  const id = b.id ?? crypto.randomUUID();

  const provConds: SQL[] = [
    eq(paymentProviders.key, b.payment_method),
    eq(paymentProviders.isActive, 1),
  ];
  const [prov] = await db.select().from(paymentProviders).where(andAll(provConds)).limit(1);
  if (!prov) return reply.code(400).send({ error: { message: 'invalid_payment_method' } });

  await db.insert(paymentRequests).values({
    id,
    orderId: b.order_id,
    userId,
    amount: toDecimal(b.amount),
    currency: b.currency ?? 'TRY',
    paymentMethod: b.payment_method,
    paymentProof: b.proof_image_url ?? null,
    status: b.status,
    adminNotes: b.admin_notes ?? null,
    processedAt: b.processed_at ? new Date(b.processed_at) : null,
  } as unknown as typeof paymentRequests.$inferInsert);

  const outConds: SQL[] = [eq(paymentRequests.id, id), eq(paymentRequests.userId, userId)];
  const [row] = await db.select().from(paymentRequests).where(andAll(outConds)).limit(1);

  return reply.code(201).send(row ? mapPaymentReq(row) : null);
};

export const deletePaymentRequestHandler: RouteHandlerMethod = async (req, reply) => {
  const userId = getAuthUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const id = String((req as any).params?.id ?? '').trim();
  const conds: SQL[] = [eq(paymentRequests.id, id), eq(paymentRequests.userId, userId)];

  const [exists] = await db
    .select({ id: paymentRequests.id })
    .from(paymentRequests)
    .where(andAll(conds))
    .limit(1);

  if (!exists) return reply.code(404).send({ success: false });

  await db.delete(paymentRequests).where(andAll(conds));
  return reply.send({ success: true });
};

// ===================================================================
// Payment Sessions (PUBLIC create/get) — provider-aware (PayTR)
// ===================================================================

export const createPaymentSessionHandler: RouteHandlerMethod = async (req, reply) => {
  const parsed = createPaymentSessionBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const body = parsed.data;

  const providerKey = String(body.provider_key).trim().toLowerCase();
  const orderIdIn = body.order_id ? String(body.order_id).trim() : null;

  const provConds: SQL[] = [
    eq(paymentProviders.key, providerKey),
    eq(paymentProviders.isActive, 1),
  ];
  const [prov] = await db.select().from(paymentProviders).where(andAll(provConds)).limit(1);
  if (!prov) return reply.code(400).send({ error: { message: 'invalid_payment_method' } });

  if (orderIdIn) {
    const [existing] = await db
      .select()
      .from(paymentSessions)
      .where(
        andAll([
          eq(paymentSessions.providerKey, providerKey),
          eq(paymentSessions.orderId, orderIdIn),
          eq(paymentSessions.status, 'pending'),
        ]),
      )
      .limit(1);

    if (existing) return reply.send(mapSession(existing));
  }

  const id = crypto.randomUUID();

  let iframeUrl: string | null = null;
  let redirectUrl: string | null = null;
  let clientSecret: string | null = null;

  const metaObj = (body.meta ?? null) as Record<string, unknown> | null;

  if (providerKey === 'paytr') {
    const amountTry = toNum(body.amount);
    if (!Number.isFinite(amountTry) || amountTry <= 0) {
      return reply.code(400).send({ error: { message: 'invalid_amount' } });
    }

    // commission from provider public_config if exists (informational only)
    const provPublic = parseJsonObject(prov.publicConfig) ?? null;
    const commission_rate = toCommissionRate(provPublic?.commission) ?? 0;

    // NOTE: FE already includes commission in amount (if any)
    const totalTry = amountTry;
    const payment_amount = Math.round(amountTry * 100); // KURUŞ

    if (payment_amount < 1) {
      return reply.code(400).send({ error: { message: 'invalid_amount' } });
    }

    const merchant_oid = orderIdIn ?? `OID_${Date.now()}`;

    const emailFromMeta = typeof metaObj?.email === 'string' ? metaObj.email.trim() : '';
    const emailFromCustomer =
      typeof body.customer?.email === 'string' ? body.customer.email.trim() : '';
    const email = emailFromMeta || emailFromCustomer || 'guest@example.com';

    const user_name =
      (typeof body.customer?.name === 'string' && body.customer.name.trim()) ||
      (typeof metaObj?.user_name === 'string' && String(metaObj.user_name).trim()) ||
      'Guest';

    const user_address =
      (typeof metaObj?.user_address === 'string' && String(metaObj.user_address).trim()) || 'N/A';

    const user_phone =
      (typeof metaObj?.user_phone === 'string' && String(metaObj.user_phone).trim()) ||
      '0000000000';

    // ✅ basket normalize (TL strings)
    let basketTL = normalizePaytrBasketTL(metaObj?.basket);

    // if no basket from FE, build deterministic one
    if (basketTL.length === 0) {
      basketTL = [['Ödeme', amountTry.toFixed(2), 1]];
    } else {
      // keep basket total consistent with charged totalTry
      const basketTotal = sumBasketTL(basketTL);
      const diff = Number((totalTry - basketTotal).toFixed(2));

      // allow tiny rounding differences
      if (Math.abs(diff) > 0.05) {
        if (diff > 0) {
          // add balancing line (PayTR rejects mismatches)
          basketTL.push(['Tutar Dengeleme', diff.toFixed(2), 1]);
        } else {
          // basket total exceeds charge; reduce last item to match
          const lastIdx = basketTL.length - 1;
          const last = basketTL[lastIdx];
          const unit = Number(last?.[1]);
          const qty = Math.max(1, Number(last?.[2] ?? 1));
          const newUnit = Number.isFinite(unit) ? unit + diff / qty : NaN;

          if (Number.isFinite(newUnit) && newUnit > 0) {
            basketTL[lastIdx] = [last[0], newUnit.toFixed(2), qty];
          } else {
            // fallback to a single-line basket
            basketTL = [['Ödeme', totalTry.toFixed(2), 1]];
          }
        }
        req.log.warn(
          { merchant_oid, amountTry, totalTry, basketTotal, diff, basketTL },
          'paytr basket_total_mismatch -> balancing line added',
        );
      }
    }

    const basket: PaytrBasketItem[] = basketTL.map(([n, u, q]) => [n, u, q]);

    // lang OPTIONAL (send only if provided, otherwise omit)
    const langMaybe =
      typeof metaObj?.lang === 'string' && metaObj.lang.trim() ? metaObj.lang.trim() : undefined;

    let tokenRes: { token: string; iframe_url: string } | null = null;
    try {
      let user_ip = getClientIp(req);
      if (isPrivateOrLoopback(user_ip)) {
        const metaDevIp =
          typeof metaObj?.dev_user_ip === 'string' ? metaObj.dev_user_ip.trim() : '';

        let devIp = metaDevIp;
        if (!devIp) {
          try {
            const map = await getSiteSettingsMap(['paytr_dev_user_ip'] as const);
            devIp = (map.get('paytr_dev_user_ip') ?? '').trim();
          } catch {
            // ignore; fallback to env
          }
        }

        if (!devIp) devIp = (process.env.PAYTR_DEV_USER_IP ?? '').trim();
        if (devIp) user_ip = devIp;
      }

      tokenRes = await createPaytrToken({
        email,
        user_ip,
        merchant_oid,
        payment_amount,
        currency: 'TL',
        basket,
        ...(langMaybe ? { lang: langMaybe as any } : {}),
        user_name,
        user_address,
        user_phone,
      });
    } catch (e: any) {
      req.log.error(
        {
          err: e?.message || e,
          merchant_oid,
          email,
          payment_amount,
          amountTry,
          totalTry,
          basket,
        },
        'paytr get-token failed',
      );
      return reply
        .code(502)
        .send({ error: { message: 'paytr_token_failed', detail: e?.message || 'unknown' } });
    }

    const token = typeof tokenRes?.token === 'string' ? tokenRes.token.trim() : '';
    const iframe_url = typeof tokenRes?.iframe_url === 'string' ? tokenRes.iframe_url.trim() : '';

    if (!token || !iframe_url) {
      return reply.code(502).send({ error: { message: 'paytr_token_missing' } });
    }

    clientSecret = token;
    iframeUrl = iframe_url;

    const mergedExtra = {
      ...(metaObj ?? {}),
      paytr: {
        merchant_oid,
        payment_amount, // KURUŞ
        amount_try: Number(amountTry.toFixed(2)),
        total_try: Number(totalTry.toFixed(2)),
        commission_rate,
        basket_tl: basketTL,
      },
    };

    await db.insert(paymentSessions).values({
      id,
      providerKey,
      orderId: merchant_oid, // ✅ IMPORTANT: must match PayTR notify merchant_oid
      amount: toDecimal(body.amount),
      currency: body.currency ?? 'TRY',
      status: 'pending',
      clientSecret,
      iframeUrl,
      redirectUrl,
      extra: toJsonString(mergedExtra),
    } as unknown as typeof paymentSessions.$inferInsert);

    const [row] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.id, id))
      .limit(1);

    if (!row) return reply.code(500).send({ error: { message: 'session_create_failed' } });
    return reply.code(201).send(mapSession(row));
  }

  // ===================================================================
  // Shopier (form-based)
  // ===================================================================
  if (providerKey === 'shopier') {
    const amountTry = toNum(body.amount);
    if (!Number.isFinite(amountTry) || amountTry <= 0) {
      return reply.code(400).send({ error: { message: 'invalid_amount' } });
    }

    const orderRef = orderIdIn ?? `OID_${Date.now()}`;
    const currency = (body.currency ?? 'TRY') as any;

    const metaObj = (body.meta ?? null) as Record<string, unknown> | null;
    const customerName =
      (typeof body.customer?.name === 'string' && body.customer.name.trim()) ||
      (typeof metaObj?.buyer_name === 'string' && String(metaObj.buyer_name).trim()) ||
      'Guest User';
    const { first, last } = splitName(customerName);

    const buyer_email =
      (typeof body.customer?.email === 'string' && body.customer.email.trim()) ||
      (typeof metaObj?.buyer_email === 'string' && String(metaObj.buyer_email).trim()) ||
      'guest@example.com';

    const buyer_phone =
      (typeof metaObj?.buyer_phone === 'string' && String(metaObj.buyer_phone).trim()) ||
      (typeof metaObj?.user_phone === 'string' && String(metaObj.user_phone).trim()) ||
      undefined;

    let form: { form_action: string; form_data: Record<string, string | number> };
    try {
      form = await createShopierForm({
        platform_order_id: orderRef,
        total_order_value: amountTry.toFixed(2),
        currency,

        product_name:
          (typeof metaObj?.product_name === 'string' && metaObj.product_name.trim()) ||
          'Sipariş',
        product_type: 1,

        buyer_name: first || 'Guest',
        buyer_surname: last || 'User',
        buyer_email,
        ...(buyer_phone ? { buyer_phone } : {}),

        buyer_account_age: metaObj?.buyer_account_age as any,
        buyer_id_nr: metaObj?.buyer_id_nr as any,

        billing_address: metaObj?.billing_address as any,
        billing_city: metaObj?.billing_city as any,
        billing_country: metaObj?.billing_country as any,
        billing_postcode: metaObj?.billing_postcode as any,

        shipping_address: metaObj?.shipping_address as any,
        shipping_city: metaObj?.shipping_city as any,
        shipping_country: metaObj?.shipping_country as any,
        shipping_postcode: metaObj?.shipping_postcode as any,

        is_in_frame: metaObj?.is_in_frame as any,
        current_language: metaObj?.current_language as any,
      });
    } catch (e: any) {
      req.log.error({ err: e?.message || e, orderRef }, 'shopier-create-form failed');
      return reply.code(502).send({ error: { message: 'shopier_form_failed' } });
    }

    await db.insert(paymentSessions).values({
      id,
      providerKey,
      orderId: orderRef,
      amount: toDecimal(body.amount),
      currency: body.currency ?? 'TRY',
      status: 'pending',
      clientSecret,
      iframeUrl,
      redirectUrl,
      extra: toJsonString({
        ...(metaObj ?? {}),
        shopier: form,
      }),
    } as unknown as typeof paymentSessions.$inferInsert);

    const [row] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.id, id))
      .limit(1);

    if (!row) return reply.code(500).send({ error: { message: 'session_create_failed' } });
    return reply.code(201).send(mapSession(row));
  }

  await db.insert(paymentSessions).values({
    id,
    providerKey,
    orderId: orderIdIn,
    amount: toDecimal(body.amount),
    currency: body.currency ?? 'TRY',
    status: 'pending',
    clientSecret,
    iframeUrl,
    redirectUrl,
    extra: toJsonString(body.meta ?? null),
  } as unknown as typeof paymentSessions.$inferInsert);

  const [row] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, id)).limit(1);
  if (!row) return reply.code(500).send({ error: { message: 'session_create_failed' } });

  return reply.code(201).send(mapSession(row));
};

export const getPaymentSessionByIdHandler: RouteHandlerMethod = async (req, reply) => {
  const id = String((req as any).params?.id ?? '').trim();
  const [r] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, id)).limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapSession(r));
};

// ===================================================================
// Public Payment Methods (aggregate)
// ===================================================================

export const getPublicPaymentMethodsHandler: RouteHandlerMethod = async (_req, reply) => {
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

  const resp: PublicPaymentMethodsResp = { currency, guest_order_enabled, methods };
  return reply.send(resp);
};
