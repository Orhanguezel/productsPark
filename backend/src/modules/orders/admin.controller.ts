// ===================================================================
// FILE: src/modules/orders/admin.controller.ts
// ===================================================================
import type { RouteHandler } from 'fastify';
import { sql, and, or, eq, gte, lte, between, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { z } from 'zod';
import {
  orders,
  order_items,
  type OrderRow,
  type OrderItemRow,
} from './schema';

// Ürün bilgisi için hafif join (varsa):
import { products } from '@/modules/products/schema';

// --------------------- FE tarafındaki görüntü tipleri ---------------------
export type OrderView = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
};

export type OrderItemView = {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  total_price: number;
  activation_code: string | null;
  delivery_status: string | null;
  selected_options?: Record<string, string> | null;
  api_order_id?: string | null;
  turkpin_order_no?: string | null;
  product_id: string | null;
  products?: {
    file_url: string | null;
    delivery_type: string | null;
    custom_fields?: {
      id: string;
      label: string;
      type: string;
      placeholder: string;
      required: boolean;
    }[] | null;
  };
  delivery_content?: string | null;
};

// --------------------------- Yardımcılar ---------------------------
const toNum = (v: unknown): number =>
  typeof v === 'number' ? v : Number(v ?? 0);

const parseJson = <T = any>(v: unknown): T | null => {
  if (v == null) return null;
  if (typeof v !== 'string') return v as T;
  try { return JSON.parse(v) as T; } catch { return null; }
};

const mapOrderView = (o: OrderRow): OrderView => ({
  id: o.id,
  order_number: o.order_number,
  customer_name: o.customer_name ?? '',
  customer_email: o.customer_email ?? '',
  customer_phone: o.customer_phone ?? null,
  total_amount: toNum(o.subtotal),
  discount_amount: toNum(o.discount),
  final_amount: toNum(o.total),
  status: o.status,
  payment_status: o.payment_status,
  payment_method: o.payment_method,
  notes: o.notes ?? null,
  created_at: String(o.created_at),
  user_id: o.user_id,
});

type JoinedProd = {
  file_url: string | null;
  delivery_type: string | null;
  custom_fields?: unknown;
} | undefined;

const mapItemView = (it: OrderItemRow & {
  api_order_id?: string | null;
  turkpin_order_no?: string | null;
  options?: unknown;
  products?: JoinedProd;
  delivery_content?: string | null;
}): OrderItemView => {
  const prod = it.products;
  const parsedCF = prod?.custom_fields != null ? parseJson(prod.custom_fields) : null;

  return {
    id: it.id,
    product_name: it.product_name,
    quantity: toNum(it.quantity),
    product_price: toNum(it.price),
    total_price: toNum(it.total),
    activation_code: it.activation_code ?? null,
    delivery_status: it.delivery_status ?? null,
    selected_options: parseJson<Record<string, string>>(it.options ?? null),
    api_order_id: (it as any).api_order_id ?? null,
    turkpin_order_no: (it as any).turkpin_order_no ?? null,
    product_id: (it as any).product_id ?? null,
    products: prod
      ? {
          file_url: prod.file_url,
          delivery_type: prod.delivery_type,
          custom_fields: parsedCF as NonNullable<OrderItemView['products']>['custom_fields'],
        }
      : undefined,
    delivery_content: (it as any).delivery_content ?? null,
  };
};

// --------------------------- Zod Şemaları ---------------------------
// ŞEMA ile birebir: ['pending','processing','completed','cancelled','refunded']
const orderStatuses = [
  'pending', 'processing', 'completed', 'cancelled', 'refunded',
] as const;

const fulfillmentStatuses = [
  'unfulfilled','partial','fulfilled','returned','cancelled',
] as const;

const dec2 = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g,'').replace(',','.'));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  user_id: z.string().optional(),
  status: z.enum(orderStatuses).optional(),
  payment_status: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  min_total: dec2.optional(),
  max_total: dec2.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['created_at','total_price','status']).optional(),
  order: z.enum(['asc','desc']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(orderStatuses),
  note: z.string().nullable().optional(),
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
  shipped_at: z.string().nullable().optional(), // ISO
  status: z.enum(fulfillmentStatuses).optional(),
});

const noteSchema = z.object({ message: z.string().min(1) });

// --------------------------- Timeline yardımcıları ---------------------------
async function addTimeline(orderId: string, type: string, message: string, actorName?: string | null, meta?: unknown) {
  await db.execute(sql`
    INSERT INTO order_timeline (id, order_id, type, message, actor_name, meta, created_at)
    VALUES (UUID(), ${orderId}, ${type}, ${message}, ${actorName ?? null}, ${JSON.stringify(meta ?? null)}, NOW())
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

// --------------------------- Controllers (ADMIN) ---------------------------

// GET /admin/orders
export const listOrdersAdmin: RouteHandler = async (req, reply) => {
  const q = listQuerySchema.parse(req.query ?? {});
  const conds: any[] = [];

  if (q.q) {
    const like = `%${q.q}%`;
    conds.push(or(
      sql`${orders.order_number} LIKE ${like}`,
      sql`${orders.customer_name} LIKE ${like}`,
      sql`${orders.customer_email} LIKE ${like}`
    ));
  }
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

  const orderCol =
    q.sort === 'total_price' ? orders.total :
    q.sort === 'status' ? orders.status :
    orders.created_at;

  const orderDir = (q.order ?? 'desc') === 'asc' ? (c: any) => c : (c: any) => desc(c);

  const rows = await db
    .select()
    .from(orders)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(orderDir(orderCol))
    .limit(q.limit ?? 50)
    .offset(q.offset ?? 0);

  return reply.send(rows.map(mapOrderView));
};

// GET /admin/orders/:id
export const getOrderAdminById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapOrderView(row));
};

// GET /admin/orders/:id/items
export const listOrderItemsAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

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
      prod_custom_fields: products.custom_fields, // raw(json/text)
    })
    .from(order_items)
    .leftJoin(products, eq(products.id, order_items.product_id as any))
    .where(eq(order_items.order_id, id));

  const result = items.map((it) =>
    mapItemView({
      id: it.id,
      order_id: it.order_id,
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      price: it.price,
      total: it.total,
      activation_code: it.activation_code,
      delivery_status: it.delivery_status,
      options: it.options,
      api_order_id: it.api_order_id,
      delivery_content: it.delivery_content,
      turkpin_order_no: it.turkpin_order_no,
      products: {
        file_url: it.prod_file_url,
        delivery_type: it.prod_delivery_type,
        custom_fields: it.prod_custom_fields, // parseJson mapItemView içinde
      },
    } as unknown as OrderItemRow & {
      products?: JoinedProd;
    })
  );

  return reply.send(result);
};

// PATCH /admin/orders/:id/status
export const updateOrderStatusAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = updateStatusSchema.parse(req.body ?? {});
  const [exists] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.update(orders).set({ status: body.status, updated_at: sql`NOW()` }).where(eq(orders.id, id));
  if (body.note) await addTimeline(id, 'status_change', `Status → ${body.status}. ${body.note}`);

  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return reply.send(mapOrderView(row));
};

// POST /admin/orders/:id/cancel
export const cancelOrderAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = cancelSchema.parse(req.body ?? {});
  const [exists] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.update(orders).set({ status: 'cancelled', updated_at: sql`NOW()` }).where(eq(orders.id, id));
  await addTimeline(
    id,
    'cancellation',
    body.reason ? `Order cancelled: ${body.reason}` : 'Order cancelled',
    null,
    { refund: !!body.refund, note: body.note ?? null }
  );

  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return reply.send(mapOrderView(row));
};

// POST /admin/orders/:id/refund
export const refundOrderAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = refundSchema.parse(req.body ?? {});
  const [exists] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.update(orders).set({ payment_status: 'refunded', updated_at: sql`NOW()` }).where(eq(orders.id, id));
  await addTimeline(id, 'refund', `Refunded ${body.amount}`, null, {
    reason: body.reason ?? null, note: body.note ?? null
  });

  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return reply.send(mapOrderView(row));
};

// PATCH /admin/orders/:id/fulfillment
export const updateOrderFulfillmentAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = fulfillmentSchema.parse(req.body ?? {});
  const [exists] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

  // Fulfillment, order.status değildir — sadece timeline'a yazıyoruz.
  await addTimeline(id, 'shipment', 'Fulfillment updated', null, body);

  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return reply.send(mapOrderView(row));
};

// GET /admin/orders/:id/timeline
export const listOrderTimelineAdmin: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  const data = await getTimeline(id);
  return reply.send(data);
};

// POST /admin/orders/:id/timeline
export const addOrderNoteAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = noteSchema.parse(req.body ?? {});
  const [exists] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

  await addTimeline(id, 'note', body.message);
  return reply.send({ ok: true });
};
