import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { categories } from './schema';
import { eq, sql } from 'drizzle-orm';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from './validation';
import { buildInsertPayload, buildUpdatePayload } from './controller';

// MySQL hata yardımcıları
function isDup(err: any) {
  const code = err?.code ?? err?.errno;
  return code === 'ER_DUP_ENTRY' || code === 1062;
}
function isFk(err: any) {
  const code = err?.code ?? err?.errno;
  return code === 'ER_NO_REFERENCED_ROW_2' || code === 1452;
}

/** POST /categories (admin) */
export const adminCreateCategory: RouteHandler<{ Body: CategoryCreateInput }> = async (req, reply) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const payload = buildInsertPayload(parsed.data);

  // Kendini ebeveyn yapmayı önle
  if (payload.parent_id && payload.parent_id === payload.id) {
    payload.parent_id = null;
  }

  try {
    await db.insert(categories).values(payload);
  } catch (err: any) {
    if (isDup(err)) {
      return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    }
    if (isFk(err)) {
      return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
    }
    return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
  }

  const [row] = await db.select().from(categories).where(eq(categories.id, payload.id)).limit(1);
  return reply.code(201).send(row);
};

/** PUT /categories/:id (admin) — idempotent replace/patch */
export const adminPutCategory: RouteHandler<{ Params: { id: string }; Body: CategoryUpdateInput }> = async (req, reply) => {
  const { id } = req.params;

  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const set = buildUpdatePayload(parsed.data);
  if ('parent_id' in set && set.parent_id === id) {
    set.parent_id = null; // kendine bağlanma
  }

  try {
    await db.update(categories).set(set as any).where(eq(categories.id, id));
  } catch (err: any) {
    if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    if (isFk(err)) return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
    return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
  }

  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

/** PATCH /categories/:id (admin) */
export const adminPatchCategory: RouteHandler<{ Params: { id: string }; Body: CategoryUpdateInput }> = async (req, reply) => {
  const { id } = req.params;

  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const set = buildUpdatePayload(parsed.data);
  if ('parent_id' in set && set.parent_id === id) {
    set.parent_id = null; // kendine bağlanma
  }

  try {
    await db.update(categories).set(set as any).where(eq(categories.id, id));
  } catch (err: any) {
    if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    if (isFk(err)) return reply.code(400).send({ error: { message: 'invalid_parent_id' } });
    return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
  }

  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

/** DELETE /categories/:id (admin) */
export const adminDeleteCategory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(categories).where(eq(categories.id, id));
  return reply.code(204).send();
};

/** POST /categories/reorder (admin) */
export const adminReorderCategories: RouteHandler<{ Body: { items: Array<{ id: string; display_order: number }> } }> =
  async (req, reply) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return reply.send({ ok: true });

    for (const it of items) {
      const n = Number(it.display_order) || 0;
      await db
        .update(categories)
        .set({
          display_order: n,
          // 🟢 string | SQL bekler
          updated_at: sql`CURRENT_TIMESTAMP(3)`,
        })
        .where(eq(categories.id, it.id));
    }
    return reply.send({ ok: true });
  };

/** PATCH /categories/:id/active (admin) */
export const adminToggleActive: RouteHandler<{ Params: { id: string }; Body: { is_active: boolean } }> =
  async (req, reply) => {
    const { id } = req.params;
    const v = !!req.body?.is_active;
    await db
      .update(categories)
      .set({
        // 🟢 boolean kolon
        is_active: v,
        updated_at: sql`CURRENT_TIMESTAMP(3)`,
      })
      .where(eq(categories.id, id));

    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };

/** PATCH /categories/:id/featured (admin) */
export const adminToggleFeatured: RouteHandler<{ Params: { id: string }; Body: { is_featured: boolean } }> =
  async (req, reply) => {
    const { id } = req.params;
    const v = !!req.body?.is_featured;
    await db
      .update(categories)
      .set({
        // 🟢 boolean kolon
        is_featured: v,
        updated_at: sql`CURRENT_TIMESTAMP(3)`,
      })
      .where(eq(categories.id, id));

    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };
