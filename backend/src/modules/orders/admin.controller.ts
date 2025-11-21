// ===================================================================
// FILE: src/modules/orders/admin.controller.ts
// ===================================================================
import type { RouteHandler } from "fastify";
import {
  sql,
  and,
  or,
  eq,
  gte,
  lte,
  between,
  desc,
  inArray,
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";

import { db } from "@/db/client";
import { z } from "zod";
import {
  orders,
  order_items,
  type OrderRow,
  type OrderItemRow,
} from "./schema";

import { products, productStock } from "@/modules/products/schema";
import { users } from "@/modules/auth/schema";

import {
  type OrderView,
  type OrderItemView,
  mapOrderRowToView,
  mapOrderItemRowToView,
} from "./types";

type TxOrDb = MySql2Database<any> | MySqlTransaction<any, any, any, any>;

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
  payment_status: z.string().max(50).optional(),
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

const itemsListSchema = z.object({
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});


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

/**
 * TAMAMLAMA durumunda, auto_stock ürünler için stok kullanımı:
 *
 * - Ürün: delivery_type = 'auto_stock' VEYA auto_delivery_enabled = 1 olanlar
 * - Her order_item için quantity kadar product_stock satırı seçilir (is_used = 0)
 *   -> product_stock.is_used = 1
 *   -> product_stock.used_at = NOW()
 *   -> product_stock.order_item_id = order_items.id
 * - Ürün tablosu:
 *   -> products.stock_quantity -= kullanılan stok adedi
 *   -> products.review_count   += kullanılan stok adedi (satış sayısı olarak)
 *
 * Not:
 *  - Aynı sipariş için daha önce stok ayrılmışsa (product_stock.order_item_id ile)
 *    fonksiyon hiçbir şey yapmadan çıkar (idempotent).
 */
async function reserveStockForOrder(client: TxOrDb, orderId: string) {
  // 0) Bu sipariş için daha önce stok ayrılmış mı?
  const existingRows = await client
    .select()
    .from(productStock)
    .innerJoin(
      order_items,
      eq(order_items.id, productStock.order_item_id as any),
    )
    .where(eq(order_items.order_id, orderId as any))
    .limit(1);

  if (existingRows.length > 0) {
    // Zaten stok ayrılmış, tekrar işlem yapma
    return;
  }

  // 1) Sipariş kalemlerini ve ilgili ürünleri çek
  const itemRows = await client
    .select()
    .from(order_items)
    .innerJoin(products, eq(products.id, order_items.product_id as any))
    .where(eq(order_items.order_id, orderId as any));

  if (!itemRows.length) return;

  // Ürün bazında toplam kullanılan stokları saymak için
  const byProduct = new Map<string, number>();

  for (const row of itemRows as any[]) {
    const it = row.order_items as any;
    const prod = row.products as any;

    const orderItemId = String(it.id);
    const productId = String(it.product_id);
    const qty = Number(it.quantity ?? 0);

    if (!qty || qty <= 0) continue;

    const isAuto =
      (prod.delivery_type ?? "") === "auto_stock" ||
      Number(prod.auto_delivery_enabled ?? 0) === 1;

    if (!isAuto) continue;

    // 2) Yeterli kullanılmamış stok var mı?
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
      // Stok yetersiz → üst tarafta 409 döneceğiz
      throw new Error(
        `insufficient_auto_stock:${productId}: needed=${qty}, have=${freeRows.length}`,
      );
    }

    // 🔴 BURASI HATA ÇIKARIYORDU → r.product_stock.id yok.
    // freeRows artık direkt product_stock satırı, nested değil.
    const useIds = (freeRows as any[]).map((r) => String((r as any).id));

    // 3) Seçilen stok satırlarını "kullanılmış" işaretle
    await client
      .update(productStock)
      .set({
        is_used: 1 as any,
        used_at: sql`NOW()`,
        order_item_id: orderItemId as any,
      })
      .where(inArray(productStock.id, useIds as any));

    // Ürün toplamına ekle
    byProduct.set(productId, (byProduct.get(productId) ?? 0) + qty);
  }

  // 4) Ürün stok ve satış sayısı güncelle
  for (const [productId, count] of byProduct) {
    await client
      .update(products)
      .set({
        stock_quantity: sql`${products.stock_quantity} - ${count}`,
        review_count: sql`${products.review_count} + ${count}`, // satış sayısı
      })
      .where(eq(products.id, productId as any));
  }
}


/**
 * İPTAL durumunda, ilgili siparişe ait stokları geri açar:
 * - product_stock.is_used = 0, order_item_id = NULL, used_at = NULL
 * - products.stock_quantity += iade edilen stok adedi
 * - products.review_count   -= iade edilen stok adedi (satış sayısını geri al)
 *
 * Not: Sadece product_stock.is_used = 1 ve order_items.order_id = {orderId}
 * olan satırları etkiler.
 */
async function releaseStockForOrder(client: TxOrDb, orderId: string) {
  // 1) İlgili product_stock kayıtlarını getir
  const rows = await client
    .select()
    .from(productStock)
    .innerJoin(
      order_items,
      eq(order_items.id, productStock.order_item_id as any),
    )
    .where(
      and(
        eq(order_items.order_id, orderId as any),
        eq(productStock.is_used as any, 1 as any),
      ),
    );

  if (!rows.length) return;

  const byProduct = new Map<string, number>();
  const stockIds: string[] = [];

  for (const row of rows as any[]) {
    const ps = row.product_stock as any;
    const pid = String(ps.product_id);
    const sid = String(ps.id);

    stockIds.push(sid);
    byProduct.set(pid, (byProduct.get(pid) ?? 0) + 1);
  }

  if (!stockIds.length) return;

  // 2) product_stock satırlarını boşalt
  await client
    .update(productStock)
    .set({
      is_used: 0 as any,
      used_at: null as any,
      order_item_id: null as any,
    })
    .where(inArray(productStock.id, stockIds as any));

  // 3) products.stock_quantity geri artır
  for (const [productId, count] of byProduct) {
    await client
      .update(products)
      .set({
        stock_quantity: sql`${products.stock_quantity} + ${count}`,
      })
      .where(eq(products.id, productId as any));
  }
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


// GET /admin/orders/items
export const listAllOrderItemsAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = itemsListSchema.parse(req.query ?? {});
    const conds: any[] = [];

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

    // İstatistikleri genelde tamamlanmış siparişlerden yapmak mantıklı:
    conds.push(eq(orders.status, "completed"));

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

    const rows = await (whereExpr
      ? baseQuery.where(whereExpr as any)
      : baseQuery
    )
      .limit(q.limit ?? 5000)
      .offset(q.offset ?? 0);

    const result: OrderItemView[] = rows.map((it) => {
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
    (req as any).log?.error?.(e, "admin_list_all_order_items_failed");
    return reply
      .code(500)
      .send({ error: { message: "admin_all_order_items_failed" } });
  }
};

// PATCH /admin/orders/:id/status
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

    // Status değişimi + stok işlemleri aynı transaction içinde
    await db.transaction(async (tx) => {
      // patch objesini dinamik kuruyoruz
      const patch: Record<string, unknown> = {
        status: body.status,
        updated_at: sql`NOW()`,
      };

      // FE'den payment_status geldiyse onu da güncelle
      if (body.payment_status) {
        patch.payment_status = body.payment_status;
      }

      await tx
        .update(orders)
        .set(patch as any)
        .where(eq(orders.id, id));

      if (body.status === "completed") {
        // ✅ sipariş tamamlandı → stok düş / satış sayısını artır
        await reserveStockForOrder(tx, id);
      } else if (body.status === "cancelled") {
        // ✅ iptal → stok geri aç
        await releaseStockForOrder(tx, id);
      }
    });

    if (body.note) {
      await addTimeline(
        id,
        "status_change",
        `Status → ${body.status}. ${body.note}`,
      );
    } else {
      await addTimeline(
        id,
        "status_change",
        `Status → ${body.status}`,
      );
    }

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
    // Otomatik stok yetersiz ise 409 döndür
    if (
      typeof e?.message === "string" &&
      e.message.startsWith("insufficient_auto_stock:")
    ) {
      return reply.code(409).send({
        error: {
          message: "insufficient_auto_stock",
          details: e.message,
        },
      });
    }

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

    // Status + stok iadesi aynı transaction içinde
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "cancelled", updated_at: sql`NOW()` })
        .where(eq(orders.id, id));

      // 🔁 Stokları geri aç + satış sayısını geri al
      await releaseStockForOrder(tx, id);
    });

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
