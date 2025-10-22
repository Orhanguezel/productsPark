// src/modules/rpc/assignStock.controller.ts
import type { RouteHandler } from 'fastify';
import { pool, db } from '@/db/client';
import { eq, sql } from 'drizzle-orm'; // ⬅️ sql eklendi
import { z } from 'zod';
// products şemasını sadece isim için değil, ama kalsın istersen
import { products } from '@/modules/products/schema';
import { orders, order_items } from '@/modules/orders/schema';

/** ---------- 1) items[] ile rezerve ---------- */
export type Item = { product_id: string; qty: number };
export type AssignItemsBody = { items?: Item[] };

export const assignStockByItems: RouteHandler<{ Body: AssignItemsBody }> = async (
  req,
  reply,
) => {
  const items: Item[] = Array.isArray(req.body?.items) ? req.body.items! : [];
  if (!items.length) return reply.send({ data: { success: true, reserved: [] } });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const reserved: Item[] = [];
    for (const it of items) {
      // Ürünü kilitle (raw)
      const [rows]: any = await conn.execute(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [it.product_id],
      );
      if (!rows.length) {
        await conn.rollback();
        return reply
          .code(404)
          .send({ error: { message: 'product_not_found', product_id: it.product_id } });
      }

      const current = Number(rows[0].stock ?? 0);
      if (current < it.qty) {
        await conn.rollback();
        return reply.code(409).send({
          error: {
            message: 'insufficient_stock',
            product_id: it.product_id,
            have: current,
            need: it.qty,
          },
        });
      }

      // Stok düş (raw)
      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [
        it.qty,
        it.product_id,
      ]);
      reserved.push(it);
    }

    await conn.commit();
    return reply.send({ data: { success: true, reserved } });
  } catch (e) {
    await conn.rollback();
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'stock_assign_failed' } });
  } finally {
    conn.release();
  }
};

/** ---------- 2) order_id ile rezerve ---------- */
const assignBody = z.object({ order_id: z.string().uuid() });
export type AssignOrderIdBody = z.infer<typeof assignBody>;

export const assignStockByOrderId: RouteHandler<{ Body: AssignOrderIdBody }> = async (
  req,
  reply,
) => {
  const { order_id } = assignBody.parse(req.body);

  // İlgili order_items kayıtlarını çek
  const items = await db
    .select()
    .from(order_items)
    .where(eq(order_items.order_id, order_id));

  if (!items.length) {
    return reply.code(404).send({ error: { message: 'order_items_not_found' } });
  }

  try {
    await db.transaction(async (tx) => {
      for (const it of items) {
        // 1) Ürünü kilitle ve mevcut stoğu oku (raw)
        const rows: any = await tx.execute(
          sql`SELECT stock FROM products WHERE id = ${it.product_id} FOR UPDATE`
        );
        const rowArr = Array.isArray(rows) ? rows[0] : rows; // drizzle-mysql execute sonucu
        const current = Number(rowArr?.[0]?.stock ?? 0);

        const need = Number((it as any).quantity ?? 0);
        if (current < need) {
          throw new Error(`insufficient_stock:${it.product_id}`);
        }

        // 2) Stok düş (raw)
        await tx.execute(
          sql`UPDATE products SET stock = stock - ${need} WHERE id = ${it.product_id}`
        );
      }

      // 3) Siparişi 'processing' yap (enum'un içinde olan değer)
      await tx
        .update(orders)
        .set({ status: 'processing' })
        .where(eq(orders.id, order_id));
    });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.startsWith('insufficient_stock')) {
      const productId = msg.split(':')[1] || undefined;
      return reply.code(409).send({
        error: { message: 'insufficient_stock', product_id: productId },
      });
    }
    if (msg === 'product_not_found') {
      return reply.code(404).send({ error: { message: 'product_not_found' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'reserve_failed' } });
  }

  return reply.send({ data: { success: true, reserved_count: items.length } });
};
