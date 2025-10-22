import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, eq } from 'drizzle-orm';
import { cartItems, type CartItemRow, type CartItemInsert } from './schema';
import { cartItemCreateSchema, cartItemUpdateSchema } from './validation';

const now = () => new Date();

function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error('unauthorized');
  return String(sub);
}

/** GET /cart_items → kendi sepetin */
export const listMyCart: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const rows = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.user_id, userId));
    return reply.send(rows);
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'cart_list_failed' } });
  }
};

/** POST /cart_items → ekle / merge (aynı product_id + options = tek satır) */
export const addToCart: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const input = cartItemCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();

    // Aynı ürün-id + aynı options varsa qty artır
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.user_id, userId), eq(cartItems.product_id, input.product_id)));

    const same = existing.find(
      (r: CartItemRow) =>
        JSON.stringify(r.options ?? null) === JSON.stringify(input.options ?? null),
    );

    if (same) {
      await db
        .update(cartItems)
        .set({ quantity: Number(same.quantity) + Number(input.quantity ?? 1), updated_at: now() })
        .where(eq(cartItems.id, same.id));

      const [row] = await db.select().from(cartItems).where(eq(cartItems.id, same.id)).limit(1);
      return reply.code(200).send(row);
    }

    const toInsert: CartItemInsert = {
      id,
      user_id: userId,
      product_id: input.product_id,
      quantity: input.quantity ?? 1,
      options: input.options ?? null,
      updated_at: now(),
      created_at: undefined as any, // default CURRENT_TIMESTAMP (omit at runtime)
    };
    // Drizzle default'ı kullanmak için created_at'ı geçmeyebiliriz;
    // fakat type açısından 'any' ile atıyoruz — runtime'da field gönderilmiyor.

    await db.insert(cartItems).values({
      id: toInsert.id,
      user_id: toInsert.user_id,
      product_id: toInsert.product_id,
      quantity: toInsert.quantity,
      options: toInsert.options,
      updated_at: toInsert.updated_at,
    });

    const [row] = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'cart_add_failed' } });
  }
};

/** PATCH /cart_items/:id → miktar/opsiyon güncelle */
export const updateCartItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    const patch = cartItemUpdateSchema.parse(req.body || {});

    // Yetki + varlık kontrolü
    const [rowBefore] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)))
      .limit(1);
    if (!rowBefore) return reply.code(404).send({ error: { message: 'not_found' } });

    await db
      .update(cartItems)
      .set({ ...patch, updated_at: now() })
      .where(eq(cartItems.id, id));

    const [row] = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
    return reply.send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'cart_update_failed' } });
  }
};

/** DELETE /cart_items/:id → satırı sil */
export const deleteCartItem: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    // yetki kontrolü için seç
    const [row] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.user_id, userId)))
      .limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    await db.delete(cartItems).where(eq(cartItems.id, id));
    return reply.code(204).send();
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'cart_delete_failed' } });
  }
};

/** DELETE /cart_items → tamamını temizle */
export const clearMyCart: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    await db.delete(cartItems).where(eq(cartItems.user_id, userId));
    return reply.code(204).send();
  } catch (e: any) {
    if (e?.message === 'unauthorized') {
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'cart_clear_failed' } });
  }
};
