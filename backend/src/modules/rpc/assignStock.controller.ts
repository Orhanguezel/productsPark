// src/modules/rpc/assignStock.controller.ts

import type { RouteHandler } from 'fastify';
import { pool, db } from '@/db/client';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { orders, order_items } from '@/modules/orders/schema';

/** ---------- 1) items[] ile rezerve (mevcut) ---------- */
export type Item = { product_id: string; qty: number };
export type AssignItemsBody = { items?: Item[] };

/** ---------- 1.b) FE’nin tekli parametreli gövdesi ---------- */
const singleAssignBody = z.object({
  p_order_item_id: z.string().uuid(),
  p_product_id: z.string().uuid(),
  p_quantity: z.coerce.number().int().positive(),
});

export const assignStockByItems: RouteHandler<{ Body: AssignItemsBody | unknown }> = async (req, reply) => {
  // Eğer FE tekli payload gönderiyorsa (p_* alanları)
  const maybeSingle = singleAssignBody.safeParse(req.body);
  if (maybeSingle.success) {
    const { p_product_id, p_quantity, p_order_item_id } = maybeSingle.data;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // lock + check
      const [rows]: any = await conn.execute(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [p_product_id],
      );
      if (!rows.length) {
        await conn.rollback();
        return reply.code(404).send({ error: { message: 'product_not_found', product_id: p_product_id } });
      }

      const current = Number(rows[0].stock ?? 0);
      if (current < p_quantity) {
        await conn.rollback();
        return reply.code(409).send({
          error: { message: 'insufficient_stock', product_id: p_product_id, have: current, need: p_quantity },
        });
      }

      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [p_quantity, p_product_id]);

      // (opsiyonel) order_items satırına bir iz bırakmak istersen burada update yapılabilir.

      await conn.commit();
      return reply.send({
        data: {
          success: true,
          reserved: [{ product_id: p_product_id, qty: p_quantity }],
          order_item_id: p_order_item_id,
        },
      });
    } catch (e) {
      await conn.rollback();
      req.log.error(e);
      return reply.code(500).send({ error: { message: 'stock_assign_failed' } });
    } finally {
      conn.release();
    }
  }

  // Aksi halde eski items[] akışı:
  const items: Item[] = Array.isArray((req.body as AssignItemsBody)?.items)
    ? (req.body as AssignItemsBody).items!
    : [];
  if (!items.length) return reply.send({ data: { success: true, reserved: [] } });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const reserved: Item[] = [];
    for (const it of items) {
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

/** ---------- 2) order_id ile toplu rezerve (mevcut) ---------- */
const assignBody = z.object({ order_id: z.string().uuid() });
export type AssignOrderIdBody = z.infer<typeof assignBody>;

export const assignStockByOrderId: RouteHandler<{ Body: AssignOrderIdBody }> = async (req, reply) => {
  const { order_id } = assignBody.parse(req.body);

  const items = await db.select().from(order_items).where(eq(order_items.order_id, order_id));
  if (!items.length) {
    return reply.code(404).send({ error: { message: 'order_items_not_found' } });
  }

  try {
    await db.transaction(async (tx) => {
      for (const it of items) {
        const rows: any = await tx.execute(
          sql`SELECT stock FROM products WHERE id = ${it.product_id} FOR UPDATE`
        );
        const rowArr = Array.isArray(rows) ? rows[0] : rows;
        const current = Number(rowArr?.[0]?.stock ?? 0);

        const need = Number((it as any).quantity ?? 0);
        if (current < need) {
          throw new Error(`insufficient_stock:${it.product_id}`);
        }

        await tx.execute(sql`UPDATE products SET stock = stock - ${need} WHERE id = ${it.product_id}`);
      }

      await tx.update(orders).set({ status: 'processing' }).where(eq(orders.id, order_id));
    });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.startsWith('insufficient_stock')) {
      const productId = msg.split(':')[1] || undefined;
      return reply.code(409).send({ error: { message: 'insufficient_stock', product_id: productId } });
    }
    if (msg === 'product_not_found') {
      return reply.code(404).send({ error: { message: 'product_not_found' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'reserve_failed' } });
  }

  return reply.send({ data: { success: true, reserved_count: items.length } });
};
