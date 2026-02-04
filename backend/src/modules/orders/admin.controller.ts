// ===================================================================
// FILE: src/modules/orders/admin.controller.ts
// FINAL — Payment-gated status transitions + proper fulfillment update
// ===================================================================

import type { RouteHandler } from 'fastify';
import { sql, and, or, eq, gte, lte, between, desc, inArray } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { MySqlTransaction } from 'drizzle-orm/mysql-core';

import { db } from '@/db/client';
import { z } from 'zod';
import { orders, order_items, type OrderRow, type OrderItemRow } from './schema';

import { products, productStock } from '@/modules/products/schema';
import { users } from '@/modules/auth/schema';

import {
  type OrderView,
  type OrderItemView,
  mapOrderRowToView,
  mapOrderItemRowToView,
} from './types';

type TxOrDb = MySql2Database<any> | MySqlTransaction<any, any, any, any>;

const parseJson = <T = any>(v: unknown): T | null => {
  if (v == null) return null;
  if (typeof v !== 'string') return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
};

const nowSql = () => sql`NOW()`;

// --------------------------- Zod ---------------------------

const orderStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'] as const;

const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const;

const dec2 = z.union([z.string(), z.number()]).transform((v: string | number) => {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  user_id: z.string().optional(),
  status: z.enum(orderStatuses).optional(),
  payment_status: z.enum(paymentStatuses).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  min_total: dec2.optional(),
  max_total: dec2.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['created_at', 'total_price', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(orderStatuses),
  note: z.string().nullable().optional(),
  payment_status: z.enum(paymentStatuses).optional(),
});

const cancelSchema = z.object({
  reason: z.string().nullable().optional(),
  refund: z.boolean().optional(),
  note: z.string().nullable().optional(),
});

const refundSchema = z.object({
  amount: dec2,
  reason: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

const fulfillmentSchema = z.object({
  tracking_number: z.string().nullable().optional(),
  tracking_url: z.string().url().nullable().optional(),
  carrier: z.string().nullable().optional(),
  shipped_at: z.string().nullable().optional(),
  status: z.enum(['unfulfilled', 'partial', 'fulfilled', 'returned', 'cancelled']).optional(),
});

const noteSchema = z
  .union([
    z.object({ message: z.string().min(1) }),
    z.object({ note: z.string().min(1) }),
    z.object({ text: z.string().min(1) }),
    z.string().min(1),
  ])
  .transform((v: string | { message?: string; note?: string; text?: string }) => ({
    message: typeof v === 'string' ? v : (v.message ?? v.note ?? v.text),
  }));

const itemsListSchema = z.object({
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// --------------------------- Timeline helpers ---------------------------

async function addTimeline(
  orderId: string,
  type: string,
  message: string,
  actorName?: string | null,
  meta?: unknown,
) {
  await db.execute(sql`
    INSERT INTO order_timeline (id, order_id, type, message, actor_name, meta, created_at)
    VALUES (UUID(), ${orderId}, ${type}, ${message}, ${actorName ?? null}, ${JSON.stringify(
      meta ?? null,
    )}, NOW())
  `);
}

async function getTimeline(orderId: string) {
  const rows: any = await db.execute(sql`
    SELECT id, order_id, type, message, actor_name, meta, created_at
    FROM order_timeline
    WHERE order_id = ${orderId}
    ORDER BY created_at DESC
  `);
  const data: any[] = Array.isArray(rows) ? rows : (rows?.rows ?? []);
  return data.map((r) => ({
    id: String(r.id),
    order_id: String(r.order_id),
    type: String(r.type),
    message: String(r.message),
    actor: r.actor_name ? { id: '', name: String(r.actor_name) } : undefined,
    meta: parseJson(r.meta),
    created_at: String(r.created_at),
  }));
}

// --------------------------- Stock helpers ---------------------------

/**
 * completed => auto_stock ürünlerde stok ayrımı.
 * İdempotent: daha önce ayrıldıysa tekrar yapmaz.
 */
async function reserveStockForOrder(client: TxOrDb, orderId: string) {
  const existingRows = await client
    .select()
    .from(productStock)
    .innerJoin(order_items, eq(order_items.id, productStock.order_item_id as any))
    .where(eq(order_items.order_id, orderId as any))
    .limit(1);

  if (existingRows.length > 0) return;

  const itemRows = await client
    .select()
    .from(order_items)
    .innerJoin(products, eq(products.id, order_items.product_id as any))
    .where(eq(order_items.order_id, orderId as any));

  if (!itemRows.length) return;

  const byProduct = new Map<string, number>();

  for (const row of itemRows as any[]) {
    const it = row.order_items as any;
    const prod = row.products as any;

    const orderItemId = String(it.id);
    const productId = String(it.product_id);
    const qty = Number(it.quantity ?? 0);

    if (!qty || qty <= 0) continue;

    const isAuto =
      (prod.delivery_type ?? '') === 'auto_stock' || Number(prod.auto_delivery_enabled ?? 0) === 1;

    if (!isAuto) continue;

    const freeRows = await client
      .select()
      .from(productStock)
      .where(
        and(
          eq(productStock.product_id, productId as any),
          eq(productStock.is_used as any, 0 as any),
        ),
      )
      .limit(qty);

    if (freeRows.length < qty) {
      throw new Error(
        `insufficient_auto_stock:${productId}: needed=${qty}, have=${freeRows.length}`,
      );
    }

    const useIds = (freeRows as any[]).map((r) => String((r as any).id));

    await client
      .update(productStock)
      .set({
        is_used: 1 as any,
        used_at: sql`NOW()`,
        order_item_id: orderItemId as any,
      })
      .where(inArray(productStock.id, useIds as any));

    byProduct.set(productId, (byProduct.get(productId) ?? 0) + qty);
  }

  for (const [productId, count] of byProduct) {
    await client
      .update(products)
      .set({
        stock_quantity: sql`${products.stock_quantity} - ${count}`,
        review_count: sql`${products.review_count} + ${count}`,
      })
      .where(eq(products.id, productId as any));
  }
}

/**
 * cancelled => stok geri aç
 * Not: Join result shape farklı olabildiği için row.product_stock / row.productStock ikisini de destekler.
 */
async function releaseStockForOrder(client: TxOrDb, orderId: string) {
  const rows = await client
    .select()
    .from(productStock)
    .innerJoin(order_items, eq(order_items.id, productStock.order_item_id as any))
    .where(
      and(eq(order_items.order_id, orderId as any), eq(productStock.is_used as any, 1 as any)),
    );

  if (!rows.length) return;

  const byProduct = new Map<string, number>();
  const stockIds: string[] = [];

  for (const row of rows as any[]) {
    const ps = (row as any).product_stock ?? (row as any).productStock ?? row;
    const pid = String(ps.product_id);
    const sid = String(ps.id);

    stockIds.push(sid);
    byProduct.set(pid, (byProduct.get(pid) ?? 0) + 1);
  }

  if (!stockIds.length) return;

  await client
    .update(productStock)
    .set({
      is_used: 0 as any,
      used_at: null as any,
      order_item_id: null as any,
    })
    .where(inArray(productStock.id, stockIds as any));

  for (const [productId, count] of byProduct) {
    await client
      .update(products)
      .set({
        stock_quantity: sql`${products.stock_quantity} + ${count}`,
      })
      .where(eq(products.id, productId as any));
  }
}

// --------------------------- Policy (payment gating) ---------------------------

const requiresPaidForStatus = (next: (typeof orderStatuses)[number]) => {
  // processing/completed/refunded ileri aşama. (refunded için de ödeme alınmış olmalı)
  return next === 'processing' || next === 'completed' || next === 'refunded';
};

const requiresPaidForPaymentStatus = (next?: (typeof paymentStatuses)[number]) => {
  // refunded yapacaksan da önce paid olmuş olmalı
  return next === 'refunded';
};

// --------------------------- Controllers ---------------------------

// GET /admin/orders
export const listOrdersAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = listQuerySchema.parse(req.query ?? {});
    const conds: any[] = [];

    if (q.user_id) conds.push(eq(orders.user_id, q.user_id));
    if (q.status) conds.push(eq(orders.status, q.status));
    if (q.payment_status) conds.push(eq(orders.payment_status, q.payment_status));

    if (q.starts_at && q.ends_at) {
      conds.push(between(orders.created_at as any, q.starts_at as any, q.ends_at as any));
    } else if (q.starts_at) {
      conds.push(gte(orders.created_at as any, q.starts_at as any));
    } else if (q.ends_at) {
      conds.push(lte(orders.created_at as any, q.ends_at as any));
    }

    if (typeof q.min_total === 'number') conds.push(gte(orders.total as any, q.min_total));
    if (typeof q.max_total === 'number') conds.push(lte(orders.total as any, q.max_total));

    const likeConds =
      q.q && q.q.trim()
        ? or(
            sql`${orders.order_number} LIKE ${'%' + q.q + '%'}`,
            sql`${users.full_name} LIKE ${'%' + q.q + '%'}`,
            sql`${users.email} LIKE ${'%' + q.q + '%'}`,
            sql`${users.phone} LIKE ${'%' + q.q + '%'}`,
          )
        : undefined;

    const whereParts: any[] = [];
    if (likeConds) whereParts.push(likeConds);
    if (conds.length) whereParts.push(and(...conds));
    const whereExpr = whereParts.length ? and(...whereParts) : undefined;

    const orderCol =
      q.sort === 'total_price'
        ? orders.total
        : q.sort === 'status'
          ? orders.status
          : orders.created_at;

    const orderDir = (q.order ?? 'desc') === 'asc' ? (c: any) => c : (c: any) => desc(c);

    const baseQuery = db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id));

    // total count (admin list için faydalı)
    const totalRow = await (whereExpr
      ? db
          .select({ total: sql<number>`COUNT(*)`.as('total') })
          .from(orders)
          .leftJoin(users, eq(users.id, orders.user_id))
          .where(whereExpr as any)
      : db
          .select({ total: sql<number>`COUNT(*)`.as('total') })
          .from(orders)
          .leftJoin(users, eq(users.id, orders.user_id)));

    const total = totalRow?.[0]?.total ?? 0;

    const rows = await (whereExpr ? baseQuery.where(whereExpr as any) : baseQuery)
      .orderBy(orderDir(orderCol))
      .limit(q.limit ?? 50)
      .offset(q.offset ?? 0);

    const data: OrderView[] = rows.map(({ o, u_full_name, u_email, u_phone }) =>
      mapOrderRowToView(o as OrderRow, {
        full_name: (u_full_name as any) ?? null,
        email: (u_email as any) ?? null,
        phone: (u_phone as any) ?? null,
      }),
    );

    reply.header('x-total-count', String(total));
    reply.header('access-control-expose-headers', 'x-total-count');

    return reply.send(data);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    (req as any).log?.error?.(e, 'admin_list_orders_failed');
    return reply.code(500).send({ error: { message: 'admin_orders_list_failed' } });
  }
};

// GET /admin/orders/:id
export const getOrderAdminById: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const [row] = await db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    const view = mapOrderRowToView(row.o as OrderRow, {
      full_name: (row.u_full_name as any) ?? null,
      email: (row.u_email as any) ?? null,
      phone: (row.u_phone as any) ?? null,
    });
    return reply.send(view);
  } catch (e: any) {
    (req as any).log?.error?.(e, 'admin_get_order_failed');
    return reply.code(500).send({ error: { message: 'admin_order_get_failed' } });
  }
};

// GET /admin/orders/:id/items
export const listOrderItemsAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id: param } = req.params as { id: string };

    const [ord] = await db
      .select({
        id: orders.id,
        order_number: orders.order_number,
      })
      .from(orders)
      .where(or(eq(orders.id, param as any), eq(orders.order_number as any, param as any)))
      .limit(1);

    if (!ord) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    const items = await db
      .select({
        id: order_items.id,
        order_id: order_items.order_id,
        product_id: order_items.product_id,
        product_name: order_items.product_name,
        quantity: order_items.quantity,
        price: order_items.price,
        total: order_items.total,
        activation_code: order_items.activation_code,
        delivery_status: order_items.delivery_status,
        options: order_items.options,
        api_order_id: order_items.api_order_id as any,
        delivery_content: (order_items as any).delivery_content,
        turkpin_order_no: (order_items as any).turkpin_order_no,

        prod_file_url: products.file_url,
        prod_delivery_type: products.delivery_type,
        prod_custom_fields: products.custom_fields,
      })
      .from(order_items)
      .leftJoin(products, eq(products.id, order_items.product_id as any))
      .where(
        or(
          eq(order_items.order_id as any, ord.id as any),
          eq(order_items.order_id as any, ord.order_number as any),
        ),
      );

    const result: OrderItemView[] = items.map((it) => {
      const base = mapOrderItemRowToView(it as unknown as OrderItemRow);
      const productsJoined =
        it.prod_file_url != null || it.prod_delivery_type != null || it.prod_custom_fields != null
          ? {
              file_url: it.prod_file_url ?? null,
              delivery_type: it.prod_delivery_type ?? null,
              custom_fields: parseJson<any[]>(it.prod_custom_fields) ?? null,
            }
          : undefined;

      return { ...base, products: productsJoined };
    });

    return reply.send(result);
  } catch (e: any) {
    (req as any).log?.error?.(e, 'admin_list_order_items_failed');
    return reply.code(500).send({ error: { message: 'admin_order_items_failed' } });
  }
};

// GET /admin/orders/items
export const listAllOrderItemsAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = itemsListSchema.parse(req.query ?? {});
    const conds: any[] = [];

    if (q.starts_at && q.ends_at) {
      conds.push(between(orders.created_at as any, q.starts_at as any, q.ends_at as any));
    } else if (q.starts_at) {
      conds.push(gte(orders.created_at as any, q.starts_at as any));
    } else if (q.ends_at) {
      conds.push(lte(orders.created_at as any, q.ends_at as any));
    }

    conds.push(eq(orders.status, 'completed'));

    const whereExpr = conds.length ? and(...conds) : undefined;

    const baseQuery = db
      .select({
        id: order_items.id,
        order_id: order_items.order_id,
        product_id: order_items.product_id,
        product_name: order_items.product_name,
        quantity: order_items.quantity,
        price: order_items.price,
        total: order_items.total,
        activation_code: order_items.activation_code,
        delivery_status: order_items.delivery_status,
        options: order_items.options,
        api_order_id: order_items.api_order_id as any,
        delivery_content: (order_items as any).delivery_content,
        turkpin_order_no: (order_items as any).turkpin_order_no,
        prod_file_url: products.file_url,
        prod_delivery_type: products.delivery_type,
        prod_custom_fields: products.custom_fields,
      })
      .from(order_items)
      .leftJoin(products, eq(products.id, order_items.product_id as any))
      .innerJoin(orders, eq(orders.id, order_items.order_id as any));

    const rows = await (whereExpr ? baseQuery.where(whereExpr as any) : baseQuery)
      .limit(q.limit ?? 5000)
      .offset(q.offset ?? 0);

    const result: OrderItemView[] = rows.map((it) => {
      const base = mapOrderItemRowToView(it as unknown as OrderItemRow);
      const productsJoined =
        it.prod_file_url != null || it.prod_delivery_type != null || it.prod_custom_fields != null
          ? {
              file_url: it.prod_file_url ?? null,
              delivery_type: it.prod_delivery_type ?? null,
              custom_fields: parseJson<any[]>(it.prod_custom_fields) ?? null,
            }
          : undefined;

      return { ...base, products: productsJoined };
    });

    return reply.send(result);
  } catch (e: any) {
    (req as any).log?.error?.(e, 'admin_list_all_order_items_failed');
    return reply.code(500).send({ error: { message: 'admin_all_order_items_failed' } });
  }
};

// PATCH /admin/orders/:id/status
export const updateOrderStatusAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = updateStatusSchema.parse(req.body ?? {});

    const result = await db.transaction(async (tx) => {
      // current order (lock-ish: transaction scope; MySQL default isolation ile yeterli)
      const [ord] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);

      if (!ord) return { kind: 'not_found' as const };

      const currentPayment = String((ord as any).payment_status ?? 'pending') as any;

      // ---- POLICY: payment gate ----
      // ileri order status’a geçiş
      if (requiresPaidForStatus(body.status) && currentPayment !== 'paid') {
        return { kind: 'conflict' as const, message: 'payment_required' };
      }

      // payment_status değişimi isteniyorsa (refund gibi)
      if (
        body.payment_status &&
        requiresPaidForPaymentStatus(body.payment_status) &&
        currentPayment !== 'paid'
      ) {
        return { kind: 'conflict' as const, message: 'payment_required_for_refund' };
      }

      // patch
      const patch: Record<string, unknown> = {
        status: body.status,
        updated_at: nowSql(),
      };

      if (body.payment_status) {
        patch.payment_status = body.payment_status;
      }

      await tx
        .update(orders)
        .set(patch as any)
        .where(eq(orders.id, id));

      // stok işlemleri (paid gate zaten yukarıda)
      if (body.status === 'completed') {
        await reserveStockForOrder(tx, id);
      } else if (body.status === 'cancelled') {
        await releaseStockForOrder(tx, id);
      }

      const [row] = await tx
        .select({
          o: orders,
          u_full_name: users.full_name,
          u_email: users.email,
          u_phone: users.phone,
        })
        .from(orders)
        .leftJoin(users, eq(users.id, orders.user_id))
        .where(eq(orders.id, id))
        .limit(1);

      const view = mapOrderRowToView(row!.o as OrderRow, {
        full_name: (row!.u_full_name as any) ?? null,
        email: (row!.u_email as any) ?? null,
        phone: (row!.u_phone as any) ?? null,
      });

      return { kind: 'ok' as const, view };
    });

    if (result.kind === 'not_found') {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }
    if (result.kind === 'conflict') {
      return reply.code(409).send({ error: { message: result.message } });
    }

    // timeline (transaction dışında da olur; istersen tx içine alırız)
    await addTimeline(
      id,
      'status_change',
      body.note ? `Status → ${body.status}. ${body.note}` : `Status → ${body.status}`,
    );

    return reply.send(result.view);
  } catch (e: any) {
    if (typeof e?.message === 'string' && e.message.startsWith('insufficient_auto_stock:')) {
      return reply.code(409).send({
        error: {
          message: 'insufficient_auto_stock',
          details: e.message,
        },
      });
    }

    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }

    (req as any).log?.error?.(e, 'admin_update_order_status_failed');
    return reply.code(500).send({ error: { message: 'admin_order_status_failed' } });
  }
};

// POST /admin/orders/:id/cancel
export const cancelOrderAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = cancelSchema.parse(req.body ?? {});

    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: 'cancelled', updated_at: nowSql() } as any)
        .where(eq(orders.id, id));

      await releaseStockForOrder(tx, id);
    });

    await addTimeline(
      id,
      'cancellation',
      body.reason ? `Order cancelled: ${body.reason}` : 'Order cancelled',
      null,
      { refund: !!body.refund, note: body.note ?? null },
    );

    const [row] = await db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, id))
      .limit(1);

    const view = mapOrderRowToView(row!.o as OrderRow, {
      full_name: (row!.u_full_name as any) ?? null,
      email: (row!.u_email as any) ?? null,
      phone: (row!.u_phone as any) ?? null,
    });
    return reply.send(view);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    (req as any).log?.error?.(e, 'admin_cancel_order_failed');
    return reply.code(500).send({ error: { message: 'admin_order_cancel_failed' } });
  }
};

// POST /admin/orders/:id/refund
export const refundOrderAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = refundSchema.parse(req.body ?? {});

    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

    if (!ord) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    // POLICY: refund için önce paid olmalı
    const currentPayment = String((ord as any).payment_status ?? 'pending');
    if (currentPayment !== 'paid') {
      return reply.code(409).send({ error: { message: 'payment_required_for_refund' } });
    }

    await db
      .update(orders)
      .set({ payment_status: 'refunded', updated_at: nowSql() } as any)
      .where(eq(orders.id, id));

    await addTimeline(id, 'refund', `Refunded ${body.amount}`, null, {
      reason: body.reason ?? null,
      note: body.note ?? null,
    });

    const [row] = await db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, id))
      .limit(1);

    const view = mapOrderRowToView(row!.o as OrderRow, {
      full_name: (row!.u_full_name as any) ?? null,
      email: (row!.u_email as any) ?? null,
      phone: (row!.u_phone as any) ?? null,
    });
    return reply.send(view);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    (req as any).log?.error?.(e, 'admin_refund_order_failed');
    return reply.code(500).send({ error: { message: 'admin_order_refund_failed' } });
  }
};

// PATCH /admin/orders/:id/fulfillment
export const updateOrderFulfillmentAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = fulfillmentSchema.parse(req.body ?? {});

    const [ord] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

    if (!ord) return reply.code(404).send({ error: { message: 'not_found' } });

    // Orders şemasında kolonlar varsa update et (kolon yoksa crash etmesin)
    const patch: Record<string, unknown> = { updated_at: nowSql() };

    const oAny = orders as any;

    if (typeof oAny.tracking_number !== 'undefined' && body.tracking_number !== undefined) {
      patch['tracking_number'] = body.tracking_number;
    }
    if (typeof oAny.tracking_url !== 'undefined' && body.tracking_url !== undefined) {
      patch['tracking_url'] = body.tracking_url;
    }
    if (typeof oAny.carrier !== 'undefined' && body.carrier !== undefined) {
      patch['carrier'] = body.carrier;
    }
    if (typeof oAny.shipped_at !== 'undefined' && body.shipped_at !== undefined) {
      patch['shipped_at'] = body.shipped_at ? new Date(body.shipped_at) : null;
    }
    // fulfillment status column name could be "fulfillment_status" or "fulfillmentStatus"
    if (body.status !== undefined) {
      if (typeof oAny.fulfillment_status !== 'undefined') {
        patch['fulfillment_status'] = body.status;
      } else if (typeof oAny.fulfillmentStatus !== 'undefined') {
        patch['fulfillmentStatus'] = body.status;
      }
    }

    // Patch boşsa sadece timeline yazma; yine de updated_at var
    await db
      .update(orders)
      .set(patch as any)
      .where(eq(orders.id, id));

    await addTimeline(id, 'shipment', 'Fulfillment updated', null, body);

    const [row] = await db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id))
      .where(eq(orders.id, id))
      .limit(1);

    const view = mapOrderRowToView(row!.o as OrderRow, {
      full_name: (row!.u_full_name as any) ?? null,
      email: (row!.u_email as any) ?? null,
      phone: (row!.u_phone as any) ?? null,
    });
    return reply.send(view);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    (req as any).log?.error?.(e, 'admin_fulfillment_update_failed');
    return reply.code(500).send({ error: { message: 'admin_fulfillment_failed' } });
  }
};

// GET /admin/orders/:id/timeline
export const listOrderTimelineAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const data = await getTimeline(id);
    return reply.send(data);
  } catch (e: any) {
    (req as any).log?.error?.(e, 'admin_list_timeline_failed');
    return reply.code(500).send({ error: { message: 'admin_timeline_list_failed' } });
  }
};

// POST /admin/orders/:id/timeline
export const addOrderNoteAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const { message } = noteSchema.parse(req.body ?? {});

    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

    await addTimeline(id, 'note', message);
    return reply.send({ ok: true });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    (req as any).log?.error?.(e, 'admin_add_timeline_note_failed');
    return reply.code(500).send({ error: { message: 'timeline_note_failed' } });
  }
};

// DELETE /admin/orders/:id
export const deleteOrderAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };

    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!exists) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    await db.delete(order_items).where(eq(order_items.order_id, id));
    await db.execute(sql`DELETE FROM order_timeline WHERE order_id = ${id}`);
    await db.delete(orders).where(eq(orders.id, id));

    return reply.code(204).send();
  } catch (e: any) {
    (req as any).log?.error?.(e, 'admin_delete_order_failed');
    return reply.code(500).send({ error: { message: 'admin_order_delete_failed' } });
  }
};
