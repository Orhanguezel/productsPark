// ===================================================================
// FILE: src/modules/orders/controller.ts
// FINAL — Orders Controller (Email + Telegram + Notifications + Wallet Atomic)
// - Wallet: atomic balance decrement (no race), safe parsing, clear 409
// - Email: sendOrderCreatedMail (email_templates -> order_received)
// - Telegram: sendTelegramEvent (site_settings templates/flags inside notifier)
// - Notifications: order_created + (success) order_email_sent + order_telegram_sent
// ===================================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';

import {
  orders,
  order_items,
  type OrderInsert,
  type OrderItemInsert,
  type OrderRow,
  type OrderItemRow,
} from './schema';

import {
  orderCreateSchema,
  orderUpdateSchema,
  orderItemUpdateSchema,
  checkoutFromCartSchema,
} from './validation';

import { cartItems, type CartItemRow } from '@/modules/cart/schema';
import { coupons as couponsTable } from '@/modules/coupons/schema';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { MySqlTransaction } from 'drizzle-orm/mysql-core';
import { z } from 'zod';

import { notifications, type NotificationInsert } from '@/modules/notifications/schema';
import { sendOrderCreatedMail } from '@/modules/mail/service';
import { users } from '@/modules/auth/schema';
import { walletTransactions } from '@/modules/wallet/schema';

import { sendTelegramEvent } from '@/modules/telegram/service';

// --- helpers --------------------------------------------------------
type OrderCreateInput = z.infer<typeof orderCreateSchema>;
type TxOrDb = MySql2Database<any> | MySqlTransaction<any, any, any, any>;

const now = () => new Date();

function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error('unauthorized');
  return String(sub);
}

function genOrderNumber(prefix = 'ORD') {
  return `${prefix}${Date.now()}`;
}

function asJsonText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

function parseJsonText<T = any>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v !== 'string') return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

function toNumberSafe(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

// req.user içinden email'i güvenli çek (TS-friendly)
function getUserEmail(req: any): string | undefined {
  const u = req.user;
  if (!u || typeof u !== 'object') return undefined;
  if ('email' in u && (u as any).email) return String((u as any).email);
  return undefined;
}

// Mailde/Telegramda kullanılacak "isim" için basit helper
function getUserDisplayName(req: any): string | undefined {
  const u = req.user;
  if (!u || typeof u !== 'object') return undefined;

  if ('full_name' in u && (u as any).full_name) return String((u as any).full_name);
  if ('name' in u && (u as any).name) return String((u as any).name);

  if ('first_name' in u || 'last_name' in u) {
    const first = (u as any).first_name ?? '';
    const last = (u as any).last_name ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }

  const email = getUserEmail(req);
  if (email) return email.split('@')[0];
  return undefined;
}

function getLocaleFromRequest(req: any): string | undefined {
  const header =
    (req.headers['x-locale'] as string | undefined) ||
    (req.headers['accept-language'] as string | undefined);

  if (!header) return undefined;
  const first = header.split(',')[0]?.trim();
  if (!first) return undefined;
  return first.slice(0, 10);
}

function buildOrderItemsText(items: OrderItemRow[]): string {
  return items.map((i) => `• ${i.product_name} x${i.quantity} — ${i.total} TL`).join('\n');
}

/* ==================================================================
   NOTIFICATIONS HELPERS
   ================================================================== */

async function insertNotificationSafe(args: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) {
  const notif: NotificationInsert = {
    id: randomUUID(),
    user_id: args.userId,
    title: args.title,
    message: args.message,
    type: args.type,
    is_read: 0,
    created_at: now(),
  };

  await db.insert(notifications).values(notif);
}

/* ==================================================================
   ORDER SIDE EFFECTS (notifications + mail + telegram)
   ================================================================== */

async function sendOrderNotification(args: {
  order: OrderRow;
  items: OrderItemRow[];
  userId: string;
}) {
  const { order, items, userId } = args;

  await insertNotificationSafe({
    userId,
    title: `Siparişiniz oluşturuldu (#${order.order_number})`,
    message: `Toplam: ${order.total} TRY, ürün sayısı: ${items.length}`,
    type: 'order_created',
  });
}

async function sendOrderEmail(args: {
  order: OrderRow;
  items: OrderItemRow[];
  to?: string | null;
  req: any;
}) {
  const { order, to, req } = args;
  if (!to) return;

  const customerName = getUserDisplayName(req) ?? to;
  const locale = getLocaleFromRequest(req);
  const status = order.status ?? 'pending';

  await sendOrderCreatedMail({
    to,
    customer_name: customerName,
    order_number: order.order_number,
    final_amount: String(order.total),
    status,
    ...(locale ? { locale } : {}),
  });
}

async function sendOrderTelegram(args: { order: OrderRow; items: OrderItemRow[]; req: any }) {
  const { order, items, req } = args;

  const customerName = getUserDisplayName(req) ?? '—';
  const customerEmail = getUserEmail(req) ?? '—';

  await sendTelegramEvent({
    event: 'new_order',
    data: {
      order_number: order.order_number,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: '',
      final_amount: String(order.total),
      discount: order.discount && Number(order.discount) > 0 ? `İndirim: ${order.discount} TL` : '',
      order_items: buildOrderItemsText(items),
      created_at: new Date(order.created_at).toLocaleString('tr-TR'),
    },
  });
}

async function fireOrderCreatedEvents(opts: {
  order: OrderRow;
  items: OrderItemRow[];
  userId: string;
  req: any;
}) {
  const { order, items, userId, req } = opts;

  try {
    await sendOrderNotification({ order, items, userId });
  } catch (err) {
    req.log?.error?.(err, 'order_notification_failed');
  }

  try {
    const email = getUserEmail(req) ?? null;
    if (email) {
      await sendOrderEmail({ order, items, to: email, req });
      await insertNotificationSafe({
        userId,
        title: 'E-posta bildirimi gönderildi',
        message: `Sipariş bilgileri e-posta ile gönderildi. (#${order.order_number})`,
        type: 'order_email_sent',
      });
    }
  } catch (err) {
    req.log?.error?.(err, 'order_email_failed');
  }

  try {
    await sendOrderTelegram({ order, items, req });
    await insertNotificationSafe({
      userId,
      title: 'Telegram bildirimi gönderildi',
      message: `Sipariş bilgileri Telegram üzerinden iletildi. (#${order.order_number})`,
      type: 'order_telegram_sent',
    });
  } catch (err) {
    req.log?.error?.(err, 'order_telegram_failed');
  }
}

// ---- normalize (Account/FE RTK beklentisi) ------------------------
function mapOrder(o: OrderRow) {
  return {
    id: o.id,
    user_id: o.user_id,
    number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    total_price: Number(o.total),
    currency: 'TRY',
    coupon_code: o.coupon_code ?? null,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

// ---- kupon hesap ---------------------------------------------------
type DiscountType = 'percentage' | 'fixed';

function calcDiscount({
  discount_type,
  discount_value,
  subtotal,
  max_discount,
}: {
  discount_type: DiscountType;
  discount_value: string;
  subtotal: string;
  max_discount?: string | null;
}) {
  const sub = Number(subtotal);
  const val = Number(discount_value);
  let d = discount_type === 'percentage' ? (sub * val) / 100 : val;
  if (max_discount != null) d = Math.min(d, Number(max_discount));
  if (d < 0) d = 0;
  if (d > sub) d = sub;
  return d.toFixed(2);
}

async function validateCouponAndComputeDiscount(code: string, subtotalStr: string) {
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, code)).limit(1);
  if (!c) return { ok: false as const, reason: 'not_found' as const };
  if (!c.is_active) return { ok: false as const, reason: 'inactive' as const };
  const nowDt = now();
  if (c.valid_from && nowDt < new Date(c.valid_from))
    return { ok: false as const, reason: 'not_started' as const };
  if (c.valid_until && nowDt > new Date(c.valid_until))
    return { ok: false as const, reason: 'expired' as const };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) {
    return { ok: false as const, reason: 'usage_limit_reached' as const };
  }
  if (c.min_purchase != null && Number(subtotalStr) < Number(c.min_purchase)) {
    return {
      ok: false as const,
      reason: 'min_purchase_not_met' as const,
      min_purchase: String(c.min_purchase),
    };
  }

  const discount = calcDiscount({
    discount_type: c.discount_type as DiscountType,
    discount_value: String(c.discount_value),
    subtotal: String(subtotalStr),
    max_discount: c.max_discount ? String(c.max_discount) : null,
  });

  return { ok: true as const, coupon: c, discount };
}

async function redeemCouponAtomic(client: TxOrDb, couponId: string) {
  await client
    .update(couponsTable)
    .set({
      used_count: sql`${couponsTable.used_count} + 1`,
      updated_at: now(),
    })
    .where(
      and(
        eq(couponsTable.id, couponId),
        sql`${couponsTable.is_active} = 1`,
        sql`(${couponsTable.valid_from} IS NULL OR ${couponsTable.valid_from} <= NOW())`,
        sql`(${couponsTable.valid_until} IS NULL OR ${couponsTable.valid_until} >= NOW())`,
        or(
          isNull(couponsTable.usage_limit),
          lt(couponsTable.used_count, couponsTable.usage_limit!),
        ),
      ),
    );

  const [after] = await client
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.id, couponId))
    .limit(1);
  if (!after) throw new Error('coupon_redeem_not_found');
}

/* ==================================================================
   WALLET ÖDEMESİ (atomic wallet_balance düş + wallet_transactions.purchase)
   ================================================================== */

async function chargeWalletForOrder(opts: {
  tx: TxOrDb;
  userId: string;
  paymentMethod?: string | null;
  amountStr: string;
  orderId: string;
  orderNumber: string;
}) {
  const { tx, userId, paymentMethod, amountStr, orderId, orderNumber } = opts;

  if (paymentMethod !== 'wallet') return;

  const amount = toNumberSafe(amountStr, 0);
  if (!(amount > 0)) return;

  // Kullanıcı var mı + bakiye debug amaçlı (NULL/NaN -> 0)
  const [row] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) throw new Error('user_not_found');

  const current = toNumberSafe((row as any).wallet_balance, 0);

  // Atomic düşüm (race condition yok):
  // wallet_balance >= amount değilse affectedRows 0 => yetersiz bakiye
  const res = await tx
    .update(users)
    .set({
      wallet_balance: sql`${users.wallet_balance} - ${amount}`,
      updated_at: now(),
    } as any)
    .where(and(eq(users.id, userId), sql`${users.wallet_balance} >= ${amount}`));

  const affected =
    (res as any)?.rowsAffected ??
    (res as any)?.affectedRows ??
    (res as any)?.[0]?.affectedRows ??
    0;

  if (!affected) {
    // current'i loglamak istersen: req.log?.warn({ userId, current, amount }, 'wallet_insufficient_balance');
    void current;
    throw new Error('wallet_insufficient_balance');
  }

  // NEGATİF işlem kaydı
  const signedAmountStr = (-amount).toFixed(2);

  await tx.insert(walletTransactions).values({
    id: randomUUID(),
    userId,
    amount: signedAmountStr,
    type: 'purchase',
    description: `Sipariş ödemesi - ${orderNumber}`,
    orderId,
  } as any);


  // NOT: Eğer walletTransactions şemanız camelCase ise, yukarıdaki insert'i silin ve şunu kullanın:
  // await tx.insert(walletTransactions).values({
  //   id: randomUUID(),
  //   userId,
  //   amount: signedAmountStr,
  //   type: 'purchase',
  //   description: `Sipariş ödemesi - ${orderNumber}`,
  //   orderId,
  // } as any);
}

// ===================== READ ENDPOINTS ===============================

// GET /orders  → normalized list (RTK)
export const listOrdersNormalized: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const {
      id,
      status,
      payment_status,
      limit = 50,
      offset = 0,
      sort = 'created_at',
      order = 'desc',
    } = (req.query ?? {}) as {
      id?: string;
      status?: OrderRow['status'];
      payment_status?: string;
      limit?: number;
      offset?: number;
      sort?: 'created_at' | 'total_price';
      order?: 'asc' | 'desc';
    };

    const conds = [eq(orders.user_id, userId)];
    if (status) conds.push(eq(orders.status, status));
    if (payment_status) conds.push(eq(orders.payment_status, payment_status));
    if (id) conds.push(eq(orders.id, id));

    const sortCol = sort === 'total_price' ? orders.total : orders.created_at;

    const rows = await db
      .select()
      .from(orders)
      .where(and(...conds))
      .orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
      .limit(Number(limit))
      .offset(Number(offset));

    return reply.send(rows.map((r) => ({ ...mapOrder(r), ...r })));
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'orders_list_failed' } });
  }
};

// GET /orders/by-user/:userId → normalized list (RTK)
export const listOrdersByUserNormalized: RouteHandler = async (req, reply) => {
  try {
    const currentUserId = getAuthUserId(req);
    const { userId } = req.params as { userId: string };
    if (userId !== currentUserId) return reply.code(403).send({ error: { message: 'forbidden' } });

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at))
      .limit(200);

    return reply.send(rows.map(mapOrder));
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'orders_by_user_failed' } });
  }
};

// GET /orders/:id → raw + items + normalized alanlar
export const getOrder: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    const [ord] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
      .limit(1);

    if (!ord) return reply.code(404).send({ error: { message: 'not_found' } });

    const items: (OrderItemRow & { options: any | null })[] = (
      await db.select().from(order_items).where(eq(order_items.order_id, id))
    ).map((it) => ({ ...it, options: parseJsonText(it.options) }));

    const normalized = mapOrder(ord);
    return reply.send({ ...normalized, ...ord, items });
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_get_failed' } });
  }
};

// ===================== WRITE ENDPOINTS ==============================

// POST /orders
export const createOrder: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const body = orderCreateSchema.parse(req.body || {}) as OrderCreateInput;

    const id = randomUUID();

    const normalizedItems = body.items.map((it) => {
      const priceStr = String(it.price);
      const totalStr = it.total ?? (Number(priceStr) * Number(it.quantity)).toFixed(2);
      return { ...it, price: priceStr, total: totalStr };
    });

    const subtotalStr =
      body.subtotal ?? normalizedItems.reduce((acc, it) => acc + Number(it.total), 0).toFixed(2);

    let discountStr = body.discount ?? '0.00';
    let couponDiscountStr = '0.00';
    let totalStr = body.total ?? (Number(subtotalStr) - Number(discountStr)).toFixed(2);
    const orderNumber = body.order_number ?? genOrderNumber('ORD');

    let couponIdToRedeem: string | null = null;
    if (body.coupon_code) {
      const v = await validateCouponAndComputeDiscount(body.coupon_code, subtotalStr);
      if (!v.ok) {
        return reply.code(409).send({
          error: { message: 'coupon_invalid', reason: v.reason, ...(v as any) },
        });
      }
      discountStr = v.discount;
      couponDiscountStr = v.discount;
      totalStr = (Number(subtotalStr) - Number(discountStr)).toFixed(2);
      couponIdToRedeem = v.coupon!.id;
    }

    await db.transaction(async (tx) => {
      const orderToInsert: OrderInsert = {
        id,
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        payment_method: body.payment_method,
        payment_status: body.payment_status ?? 'pending',
        subtotal: subtotalStr,
        discount: discountStr,
        coupon_discount: couponDiscountStr,
        total: totalStr,
        coupon_code: body.coupon_code ?? null,
        notes: body.notes ?? null,
        ip_address:
          (req.headers['x-forwarded-for'] as string) ||
          (req.socket?.remoteAddress as string) ||
          null,
        user_agent: (req.headers['user-agent'] as string) || null,
        payment_provider: null,
        payment_id: null,
        created_at: now(),
        updated_at: now(),
      };

      await tx.insert(orders).values(orderToInsert);

      const orderItemsToInsert: OrderItemInsert[] = normalizedItems.map((it) => ({
        id: randomUUID(),
        order_id: id,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        price: it.price,
        total: it.total!,
        options: asJsonText(it.options),
        delivery_status: 'pending',
        activation_code: null,
        stock_code: null,
        api_order_id: null,
        delivered_at: null,
        created_at: now(),
        updated_at: now(),
      }));

      await tx.insert(order_items).values(orderItemsToInsert);

      await chargeWalletForOrder({
        tx,
        userId,
        paymentMethod: body.payment_method,
        amountStr: totalStr,
        orderId: id,
        orderNumber,
      });

      if (couponIdToRedeem) await redeemCouponAtomic(tx, couponIdToRedeem);
    });

    const [created] = await db.select().from(orders).where(eq(orders.id, id));
    if (!created) {
      req.log.error({ id }, 'order_not_found_after_insert');
      return reply.code(500).send({ error: { message: 'order_create_consistency_error' } });
    }

    const createdItems = (
      await db.select().from(order_items).where(eq(order_items.order_id, id))
    ).map((it) => ({
      ...it,
      options: parseJsonText(it.options),
    }));

    void fireOrderCreatedEvents({ order: created, items: createdItems, userId, req });

    return reply.code(201).send({ ...mapOrder(created), ...created, items: createdItems });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    if (e?.message === 'user_not_found')
      return reply.code(404).send({ error: { message: 'user_not_found' } });
    if (e?.message === 'wallet_insufficient_balance')
      return reply.code(409).send({ error: { message: 'wallet_insufficient_balance' } });

    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_create_failed' } });
  }
};

// POST /orders/checkout
export const checkoutFromCart: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const body = checkoutFromCartSchema.parse(req.body || {});
    const id = randomUUID();

    // 1) cart
    let cartRows: CartItemRow[] = [];
    if (body.cart_item_ids?.length) {
      cartRows = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.user_id, userId), inArray(cartItems.id, body.cart_item_ids)));
    } else {
      cartRows = await db.select().from(cartItems).where(eq(cartItems.user_id, userId));
    }
    if (!cartRows.length) return reply.code(400).send({ error: { message: 'cart_empty' } });

    // 2) pricing
    const pricingMap = new Map<string, { name: string; price: string }>();
    if (body.pricing?.length) {
      for (const p of body.pricing) {
        pricingMap.set(p.product_id, { name: p.product_name, price: String(p.price) });
      }
    }

    const missing: string[] = [];
    const normalizedItems = cartRows.map((row) => {
      const pr = pricingMap.get(row.product_id);
      if (!pr) missing.push(row.product_id);
      const priceStr = pr ? pr.price : '0.00';
      const productName = pr ? pr.name : 'Unknown Product';
      const totalStr = (Number(priceStr) * Number(row.quantity)).toFixed(2);
      return {
        product_id: row.product_id,
        product_name: productName,
        quantity: row.quantity,
        price: priceStr,
        total: totalStr,
        options: row.options ?? null,
      };
    });

    if (missing.length) {
      return reply.code(400).send({
        error: { message: 'pricing_required', details: { missing_product_ids: missing } },
      });
    }

    const subtotalStr =
      body.subtotal ?? normalizedItems.reduce((acc, it) => acc + Number(it.total), 0).toFixed(2);

    let discountStr = body.discount ?? '0.00';
    let couponDiscountStr = '0.00';
    let totalStr = body.total ?? (Number(subtotalStr) - Number(discountStr)).toFixed(2);
    let couponIdToRedeem: string | null = null;

    if (body.coupon_code) {
      const v = await validateCouponAndComputeDiscount(body.coupon_code, subtotalStr);
      if (!v.ok) {
        return reply.code(409).send({
          error: { message: 'coupon_invalid', reason: v.reason, ...(v as any) },
        });
      }
      discountStr = v.discount;
      couponDiscountStr = v.discount;
      totalStr = (Number(subtotalStr) - Number(discountStr)).toFixed(2);
      couponIdToRedeem = v.coupon!.id;
    }

    const orderNumber = body.order_number ?? genOrderNumber('ORD');

    await db.transaction(async (tx) => {
      const orderToInsert: OrderInsert = {
        id,
        order_number: orderNumber,
        user_id: userId,
        status: 'pending',
        payment_method: body.payment_method,
        payment_status: body.payment_status ?? 'pending',
        subtotal: String(subtotalStr),
        discount: String(discountStr),
        coupon_discount: String(couponDiscountStr),
        total: String(totalStr),
        coupon_code: body.coupon_code ?? null,
        notes: body.notes ?? null,
        ip_address:
          (req.headers['x-forwarded-for'] as string) ||
          (req.socket?.remoteAddress as string) ||
          null,
        user_agent: (req.headers['user-agent'] as string) || null,
        payment_provider: null,
        payment_id: null,
        created_at: now(),
        updated_at: now(),
      };

      await tx.insert(orders).values(orderToInsert);

      const orderItemsToInsert: OrderItemInsert[] = normalizedItems.map((it) => ({
        id: randomUUID(),
        order_id: id,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        price: String(it.price),
        total: String(it.total),
        options: asJsonText(it.options),
        delivery_status: 'pending',
        activation_code: null,
        stock_code: null,
        api_order_id: null,
        delivered_at: null,
        created_at: now(),
        updated_at: now(),
      }));

      await tx.insert(order_items).values(orderItemsToInsert);

      // ✅ Sepeti temizle
      await tx.delete(cartItems).where(
        inArray(
          cartItems.id,
          cartRows.map((r) => r.id),
        ),
      );

      await chargeWalletForOrder({
        tx,
        userId,
        paymentMethod: body.payment_method,
        amountStr: totalStr,
        orderId: id,
        orderNumber,
      });

      if (couponIdToRedeem) await redeemCouponAtomic(tx, couponIdToRedeem);
    });

    const [created] = await db.select().from(orders).where(eq(orders.id, id));
    const createdItems = (
      await db.select().from(order_items).where(eq(order_items.order_id, id))
    ).map((it) => ({
      ...it,
      options: parseJsonText(it.options),
    }));

    void fireOrderCreatedEvents({ order: created, items: createdItems, userId, req });

    return reply.code(201).send({ ...mapOrder(created), ...created, items: createdItems });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    if (e?.message === 'user_not_found')
      return reply.code(404).send({ error: { message: 'user_not_found' } });
    if (String(e?.message || '') === 'wallet_insufficient_balance')
      return reply.code(409).send({ error: { message: 'wallet_insufficient_balance' } });

    req.log.error(e);
    return reply.code(500).send({ error: { message: 'checkout_failed' } });
  }
};

// PATCH /orders/:id
export const updateOrder: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    const patch = orderUpdateSchema.parse(req.body || {});

    const allowedStatus: ReadonlyArray<OrderRow['status']> = [
      'pending',
      'processing',
      'completed',
      'cancelled',
      'refunded',
    ];

    if (patch.status && !allowedStatus.includes(patch.status as any)) {
      return reply.code(400).send({ error: { message: 'invalid_status' } });
    }

    const [ord] = await db
      .select({ id: orders.id, user_id: orders.user_id })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
      .limit(1);

    if (!ord) return reply.code(404).send({ error: { message: 'not_found' } });

    const patchDb: Partial<OrderRow> = {
      ...(patch.status ? { status: patch.status as any } : {}),
      ...(patch.payment_status ? { payment_status: patch.payment_status } : {}),
      ...(patch.payment_provider !== undefined
        ? { payment_provider: patch.payment_provider ?? null }
        : {}),
      ...(patch.payment_id !== undefined ? { payment_id: patch.payment_id ?? null } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
      updated_at: now() as any,
    };

    await db.update(orders).set(patchDb).where(eq(orders.id, id));
    const [updated] = await db.select().from(orders).where(eq(orders.id, id));
    return reply.send({ ...mapOrder(updated), ...updated });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });

    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_update_failed' } });
  }
};

// PATCH /order_items/:id
export const updateOrderItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    const patch = orderItemUpdateSchema.parse(req.body || {});

    const [item] = await db
      .select({ order_id: order_items.order_id })
      .from(order_items)
      .where(eq(order_items.id, id))
      .limit(1);

    if (!item) return reply.code(404).send({ error: { message: 'not_found' } });

    const [ord] = await db
      .select({ id: orders.id, user_id: orders.user_id })
      .from(orders)
      .where(eq(orders.id, item.order_id))
      .limit(1);

    if (!ord || ord.user_id !== userId)
      return reply.code(403).send({ error: { message: 'forbidden' } });

    const patchDb: Partial<OrderItemRow> = {
      ...(patch.delivery_status ? { delivery_status: patch.delivery_status as any } : {}),
      ...(patch.activation_code !== undefined
        ? { activation_code: patch.activation_code ?? null }
        : {}),
      ...(patch.stock_code !== undefined ? { stock_code: patch.stock_code ?? null } : {}),
      ...(patch.api_order_id !== undefined ? { api_order_id: patch.api_order_id ?? null } : {}),
      ...(patch.delivered_at !== undefined
        ? { delivered_at: (patch.delivered_at as Date | null) ?? null }
        : {}),
      ...(patch.options !== undefined ? { options: asJsonText(patch.options) as any } : {}),
      updated_at: now() as any,
    };

    await db.update(order_items).set(patchDb).where(eq(order_items.id, id));
    const [updated] = await db.select().from(order_items).where(eq(order_items.id, id));

    return reply.send({ ...updated, options: parseJsonText(updated.options) });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });

    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_item_update_failed' } });
  }
};
