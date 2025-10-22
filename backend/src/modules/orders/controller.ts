import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm';
import {
  orders,
  order_items,
  type OrderInsert,
  type OrderItemInsert,
} from './schema';
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderItemUpdateSchema,
  checkoutFromCartSchema,
} from './validation';
import { cartItems, type CartItemRow } from '@/modules/cart/schema';
import { coupons as couponsTable } from '@/modules/coupons/schema';

// ---- DB/Transaction tipi: hem db hem tx kabul etsin (TS2345 fix)
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { MySqlTransaction } from 'drizzle-orm/mysql-core';
type TxOrDb = MySql2Database<any> | MySqlTransaction<any, any, any, any>;

// date helper
const now = () => new Date();

// auth helper
function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error('unauthorized');
  return String(sub);
}

// sipariş numarası
function genOrderNumber(prefix = 'ORD') {
  return `${prefix}${Date.now()}`;
}

// JSON → LONGTEXT (JSON_VALID) için güvenli stringify
function asJsonText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

// ---- kupon indirim hesabı (sunucu kontrollü)
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
  let d = 0;

  if (discount_type === 'percentage') d = (sub * val) / 100;
  else d = val;

  if (max_discount != null) d = Math.min(d, Number(max_discount));
  if (d < 0) d = 0;
  if (d > sub) d = sub;
  return d.toFixed(2);
}

// ---- kuponu oku + kuralları doğrula + indirim miktarını hesapla
async function validateCouponAndComputeDiscount(code: string, subtotalStr: string) {
  const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, code)).limit(1);
  if (!c) return { ok: false as const, reason: 'not_found' as const };

  // aktiflik
  if (!c.is_active) return { ok: false as const, reason: 'inactive' as const };

  // tarih aralığı
  const nowDt = now();
  if (c.valid_from && nowDt < new Date(c.valid_from)) {
    return { ok: false as const, reason: 'not_started' as const };
  }
  if (c.valid_until && nowDt > new Date(c.valid_until)) {
    return { ok: false as const, reason: 'expired' as const };
  }

  // kullanım limiti
  if (c.usage_limit != null && c.used_count >= c.usage_limit) {
    return { ok: false as const, reason: 'usage_limit_reached' as const };
  }

  // min_purchase
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

// ---- kupon redeem (transaction içinde, atomik)
// TS error fix: parametre tipi TxOrDb (hem db hem tx çalışır)
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
        // aktiflik
        sql`${couponsTable.is_active} = 1`,
        // tarih aralığı
        sql`(${couponsTable.valid_from} IS NULL OR ${couponsTable.valid_from} <= NOW())`,
        sql`(${couponsTable.valid_until} IS NULL OR ${couponsTable.valid_until} >= NOW())`,
        // usage limit
        or(isNull(couponsTable.usage_limit), lt(couponsTable.used_count, couponsTable.usage_limit!)),
      ),
    );

  // güvenlik için tekrar oku
  const [after] = await client.select().from(couponsTable).where(eq(couponsTable.id, couponId)).limit(1);
  if (!after) throw new Error('coupon_redeem_not_found');
}

// GET /orders
export const listMyOrders: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at));
    return reply.send(rows);
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'orders_list_failed' } });
  }
};

// GET /orders/:id
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

    const items = await db
      .select()
      .from(order_items)
      .where(eq(order_items.order_id, id));

    return reply.send({ ...ord, items });
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_get_failed' } });
  }
};

// POST /orders
export const createOrder: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const body = orderCreateSchema.parse(req.body || {});
    const id = randomUUID();

    // items fiyat/total normalizasyonu
    const normalizedItems = body.items.map((it) => {
      const priceStr = String(it.price);
      const totalStr =
        it.total != null ? String(it.total) : (Number(priceStr) * Number(it.quantity)).toFixed(2);

      return { ...it, price: priceStr, total: totalStr };
    });

    const subtotalStr =
      body.subtotal ??
      normalizedItems.reduce((acc, it) => acc + Number(it.total), 0).toFixed(2);

    let discountStr = body.discount ?? '0.00';
    let couponDiscountStr = '0.00';
    let totalStr = body.total ?? (Number(subtotalStr) - Number(discountStr)).toFixed(2);
    const orderNumber = body.order_number ?? genOrderNumber('ORD');

    // Kupon varsa, server-side hesapla ve discount/total'ı override et
    let couponIdToRedeem: string | null = null;
    if (body.coupon_code) {
      const v = await validateCouponAndComputeDiscount(body.coupon_code, subtotalStr);
      if (!v.ok) {
        return reply.code(409).send({ error: { message: 'coupon_invalid', reason: v.reason, ...(v as any) } });
      }
      discountStr = v.discount;
      couponDiscountStr = v.discount;
      totalStr = (Number(subtotalStr) - Number(discountStr)).toFixed(2);
      couponIdToRedeem = v.coupon!.id;
    }

    // Transaction: order + items (+ coupon redeem)
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

      if (normalizedItems.length) {
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
        })) satisfies OrderItemInsert[];

        await tx.insert(order_items).values(orderItemsToInsert);
      }

      if (couponIdToRedeem) {
        await redeemCouponAtomic(tx, couponIdToRedeem);
      }
    });

    const [created] = await db.select().from(orders).where(eq(orders.id, id));
    const createdItems = await db.select().from(order_items).where(eq(order_items.order_id, id));
    return reply.code(201).send({ ...created, items: createdItems });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    if (String(e?.message || '').startsWith('coupon_')) {
      return reply.code(409).send({ error: { message: e.message } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_create_failed' } });
  }
};

// POST /orders/checkout → sepetten siparişe dönüşüm (transaction)
export const checkoutFromCart: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const body = checkoutFromCartSchema.parse(req.body || {});
    const id = randomUUID();

    // 1) Sepeti çek (tamamı veya seçili id'ler)
    let cartRows: CartItemRow[] = [];
    if (body.cart_item_ids?.length) {
      cartRows = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.user_id, userId), inArray(cartItems.id, body.cart_item_ids)));
    } else {
      cartRows = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.user_id, userId));
    }
    if (!cartRows.length) {
      return reply.code(400).send({ error: { message: 'cart_empty' } });
    }

    // 2) Fiyat kaynağı (ürün tablosu yoksa 'pricing' zorunlu)
    const pricingMap = new Map<string, { name: string; price: string }>();
    if (body.pricing?.length) {
      for (const p of body.pricing) {
        pricingMap.set(p.product_id, { name: p.product_name, price: String(p.price) });
      }
    }

    // Tüm cart satırları için price bulunmalı
    const missingPriceFor: string[] = [];
    const normalizedItems = cartRows.map((row) => {
      const pr = pricingMap.get(row.product_id);
      if (!pr) missingPriceFor.push(row.product_id);
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

    if (missingPriceFor.length) {
      return reply.code(400).send({
        error: { message: 'pricing_required', details: { missing_product_ids: missingPriceFor } },
      });
    }

    const subtotalStr =
      body.subtotal ??
      normalizedItems.reduce((acc, it) => acc + Number(it.total), 0).toFixed(2);

    // Kupon varsa, burada hesapla (client discount/total’ı geçersiz kıl)
    let discountStr = body.discount ?? '0.00';
    let couponDiscountStr = '0.00';
    let totalStr = body.total ?? (Number(subtotalStr) - Number(discountStr)).toFixed(2);
    let couponIdToRedeem: string | null = null;

    if (body.coupon_code) {
      const v = await validateCouponAndComputeDiscount(body.coupon_code, subtotalStr);
      if (!v.ok) {
        return reply.code(409).send({ error: { message: 'coupon_invalid', reason: v.reason, ...(v as any) } });
      }
      discountStr = v.discount;
      couponDiscountStr = v.discount;
      totalStr = (Number(subtotalStr) - Number(discountStr)).toFixed(2);
      couponIdToRedeem = v.coupon!.id;
    }

    const orderNumber = body.order_number ?? genOrderNumber('ORD');

    // 3) Transaction: order + order_items + cart cleanup + coupon redeem
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
      })) satisfies OrderItemInsert[];

      await tx.insert(order_items).values(orderItemsToInsert);

      // sadece işlenen cart satırlarını sil
      const toDeleteIds = cartRows.map((r) => r.id);
      await tx.delete(cartItems).where(inArray(cartItems.id, toDeleteIds));

      if (couponIdToRedeem) {
        await redeemCouponAtomic(tx, couponIdToRedeem);
      }
    });

    const [created] = await db.select().from(orders).where(eq(orders.id, id));
    const createdItems = await db.select().from(order_items).where(eq(order_items.order_id, id));
    return reply.code(201).send({ ...created, items: createdItems });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    if (String(e?.message || '').startsWith('coupon_')) {
      return reply.code(409).send({ error: { message: e.message } });
    }
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
    const [ord] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
      .limit(1);

    if (!ord) return reply.code(404).send({ error: { message: 'not_found' } });

    await db
      .update(orders)
      .set({ ...patch, updated_at: now() })
      .where(eq(orders.id, id));

    const [updated] = await db.select().from(orders).where(eq(orders.id, id));
    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
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

    if (!ord || ord.user_id !== userId) {
      return reply.code(403).send({ error: { message: 'forbidden' } });
    }

    await db
      .update(order_items)
      .set({ ...patch, updated_at: now() })
      .where(eq(order_items.id, id));

    const [updated] = await db.select().from(order_items).where(eq(order_items.id, id));
    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'order_item_update_failed' } });
  }
};
