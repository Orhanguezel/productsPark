// ===================================================================
// FILE: src/modules/orders/admin.controller.ts
// ===================================================================
import type { RouteHandler } from "fastify";
import { sql, and, or, eq, gte, lte, between, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { z } from "zod";
import {
  orders,
  order_items,
  type OrderRow,
  type OrderItemRow,
} from "./schema";

import { products } from "@/modules/products/schema";
import { users } from "@/modules/auth/schema";

import {
  type OrderView,
  type OrderItemView,
  mapOrderRowToView,
  mapOrderItemRowToView,
} from "./types";

const parseJson = <T = any>(v: unknown): T | null => {
  if (v == null) return null;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
};

// Zod
const orderStatuses = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "refunded",
] as const;

const dec2 = z.union([z.string(), z.number()]).transform((v) => {
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\./g, "").replace(",", "."));
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
  sort: z.enum(["created_at", "total_price", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
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
  shipped_at: z.string().nullable().optional(),
  status: z
    .enum(["unfulfilled", "partial", "fulfilled", "returned", "cancelled"])
    .optional(),
});

const noteSchema = z
  .union([
    z.object({ message: z.string().min(1) }),
    z.object({ note: z.string().min(1) }),
    z.object({ text: z.string().min(1) }),
    z.string().min(1),
  ])
  .transform((v) => ({
    message:
      typeof v === "string"
        ? v
        : (v as any).message ?? (v as any).note ?? (v as any).text,
  }));

// Timeline
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
  const data: any[] = Array.isArray(rows) ? rows : rows?.rows ?? [];
  return data.map((r) => ({
    id: String(r.id),
    order_id: String(r.order_id),
    type: String(r.type),
    message: String(r.message),
    actor: r.actor_name ? { id: "", name: String(r.actor_name) } : undefined,
    meta: parseJson(r.meta),
    created_at: String(r.created_at),
  }));
}

// --------------------------- Controllers ---------------------------

// GET /admin/orders
export const listOrdersAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = listQuerySchema.parse(req.query ?? {});
    const conds: any[] = [];

    if (q.user_id) conds.push(eq(orders.user_id, q.user_id));
    if (q.status) conds.push(eq(orders.status, q.status));
    if (q.payment_status)
      conds.push(eq(orders.payment_status, q.payment_status));

    if (q.starts_at && q.ends_at) {
      conds.push(
        between(
          orders.created_at as any,
          q.starts_at as any,
          q.ends_at as any,
        ),
      );
    } else if (q.starts_at) {
      conds.push(gte(orders.created_at as any, q.starts_at as any));
    } else if (q.ends_at) {
      conds.push(lte(orders.created_at as any, q.ends_at as any));
    }

    if (typeof q.min_total === "number")
      conds.push(gte(orders.total as any, q.min_total));
    if (typeof q.max_total === "number")
      conds.push(lte(orders.total as any, q.max_total));

    const likeConds =
      q.q && q.q.trim()
        ? or(
            sql`${orders.order_number} LIKE ${"%" + q.q + "%"}`,
            sql`${users.full_name} LIKE ${"%" + q.q + "%"}`,
            sql`${users.email} LIKE ${"%" + q.q + "%"}`,
            sql`${users.phone} LIKE ${"%" + q.q + "%"}`,
          )
        : undefined;

    const orderCol =
      q.sort === "total_price"
        ? orders.total
        : q.sort === "status"
        ? orders.status
        : orders.created_at;
    const orderDir =
      (q.order ?? "desc") === "asc"
        ? (c: any) => c
        : (c: any) => desc(c);

    const whereParts: any[] = [];
    if (likeConds) whereParts.push(likeConds);
    if (conds.length) whereParts.push(and(...conds));
    const whereExpr = whereParts.length ? and(...whereParts) : undefined;

    const baseQuery = db
      .select({
        o: orders,
        u_full_name: users.full_name,
        u_email: users.email,
        u_phone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.user_id));

    const rows = await (whereExpr
      ? baseQuery.where(whereExpr as any)
      : baseQuery
    )
      .orderBy(orderDir(orderCol))
      .limit(q.limit ?? 50)
      .offset(q.offset ?? 0);

    const data: OrderView[] = rows.map(
      ({ o, u_full_name, u_email, u_phone }) =>
        mapOrderRowToView(o as OrderRow, {
          full_name: (u_full_name as any) ?? null,
          email: (u_email as any) ?? null,
          phone: (u_phone as any) ?? null,
        }),
    );

    return reply.send(data);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_list_orders_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_orders_list_failed" } });
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

    if (!row)
      return reply.code(404).send({ error: { message: "not_found" } });

    const view = mapOrderRowToView(row.o as OrderRow, {
      full_name: (row.u_full_name as any) ?? null,
      email: (row.u_email as any) ?? null,
      phone: (row.u_phone as any) ?? null,
    });
    return reply.send(view);
  } catch (e: any) {
    (req as any).log?.error?.(e, "admin_get_order_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_get_failed" } });
  }
};

// GET /admin/orders/:id/items
export const listOrderItemsAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id: param } = req.params as { id: string };

    // 1) Siparişi bul (id veya order_number ile)
    const [ord] = await db
      .select({
        id: orders.id,
        order_number: orders.order_number,
      })
      .from(orders)
      .where(
        or(
          eq(orders.id, param as any),
          eq(orders.order_number as any, param as any),
        ),
      )
      .limit(1);

    if (!ord) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    // 2) Items’ları getir — hem id hem order_number ile eşle (geriye dönük kayıtlar için)
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

        // joined product fields
        prod_file_url: products.file_url,
        prod_delivery_type: products.delivery_type,
        prod_custom_fields: products.custom_fields,
      })
      .from(order_items)
      .leftJoin(products, eq(products.id, order_items.product_id as any))
      .where(
        or(
          eq(order_items.order_id as any, ord.id as any),
          eq(order_items.order_id as any, ord.order_number as any), // ← eski kayıtlar
        ),
      );

    // 3) View’a map + custom_fields JSON parse
    const result: OrderItemView[] = items.map((it) => {
      const base = mapOrderItemRowToView(
        it as unknown as OrderItemRow,
      );
      const productsJoined =
        it.prod_file_url != null ||
        it.prod_delivery_type != null ||
        it.prod_custom_fields != null
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
    (req as any).log?.error?.(e, "admin_list_order_items_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_items_failed" } });
  }
};

// PATCH /admin/orders/:id/status
export const updateOrderStatusAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = updateStatusSchema.parse(req.body ?? {});
    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!exists)
      return reply.code(404).send({ error: { message: "not_found" } });

    await db
      .update(orders)
      .set({ status: body.status, updated_at: sql`NOW()` })
      .where(eq(orders.id, id));
    if (body.note)
      await addTimeline(
        id,
        "status_change",
        `Status → ${body.status}. ${body.note}`,
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
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_update_order_status_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_status_failed" } });
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
    if (!exists)
      return reply.code(404).send({ error: { message: "not_found" } });

    await db
      .update(orders)
      .set({ status: "cancelled", updated_at: sql`NOW()` })
      .where(eq(orders.id, id));
    await addTimeline(
      id,
      "cancellation",
      body.reason
        ? `Order cancelled: ${body.reason}`
        : "Order cancelled",
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
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_cancel_order_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_cancel_failed" } });
  }
};

// POST /admin/orders/:id/refund
export const refundOrderAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const body = refundSchema.parse(req.body ?? {});
    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!exists)
      return reply.code(404).send({ error: { message: "not_found" } });

    await db
      .update(orders)
      .set({ payment_status: "refunded", updated_at: sql`NOW()` })
      .where(eq(orders.id, id));
    await addTimeline(id, "refund", `Refunded ${body.amount}`, null, {
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
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_refund_order_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_refund_failed" } });
  }
};

// PATCH /admin/orders/:id/fulfillment
export const updateOrderFulfillmentAdmin: RouteHandler = async (
  req,
  reply,
) => {
  try {
    const { id } = req.params as { id: string };
    const body = fulfillmentSchema.parse(req.body ?? {});
    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (!exists)
      return reply.code(404).send({ error: { message: "not_found" } });

    await addTimeline(id, "shipment", "Fulfillment updated", null, body);

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
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_fulfillment_update_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_fulfillment_failed" } });
  }
};

// GET /admin/orders/:id/timeline
export const listOrderTimelineAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const data = await getTimeline(id);
    return reply.send(data);
  } catch (e: any) {
    (req as any).log?.error?.(e, "admin_list_timeline_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_timeline_list_failed" } });
  }
};

// POST /admin/orders/:id/timeline
export const addOrderNoteAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const { message } = noteSchema.parse(req.body ?? {}); // normalize

    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!exists)
      return reply.code(404).send({ error: { message: "not_found" } });

    await addTimeline(id, "note", message);
    return reply.send({ ok: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any).log?.error?.(e, "admin_add_timeline_note_failed");
    return reply
      .code(500)
      .send({ error: { message: "timeline_note_failed" } });
  }
};

// DELETE /admin/orders/:id
export const deleteOrderAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };

    // var mı?
    const [exists] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!exists) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    // çocukları ve timeline'ı temizle → sonra order'ı sil
    // (FK kısıtı varsa 1451 hatasını böylece engeller)
    await db.delete(order_items).where(eq(order_items.order_id, id));
    await db.execute(sql`DELETE FROM order_timeline WHERE order_id = ${id}`);
    await db.delete(orders).where(eq(orders.id, id));

    // FE runDelete() gövdeyi kullanmıyor → 204 yeter
    return reply.code(204).send();
  } catch (e: any) {
    (req as any).log?.error?.(e, "admin_delete_order_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_order_delete_failed" } });
  }
};
