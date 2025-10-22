import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { categories } from './schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from './validation';

// helper: now (updated_at ayarlamak için)
const now = () => new Date();

// GET /categories  (basit filtreler)
export const listCategories: RouteHandler<{
  Querystring: { parent_id?: string; is_featured?: '1' | '0' | 'true' | 'false' };
}> = async (req, reply) => {
  const q = req.query;
  const conds = [];

  if (q.parent_id) conds.push(eq(categories.parent_id, q.parent_id));
  if (q.is_featured !== undefined) {
    const v = q.is_featured === 'true' || q.is_featured === '1' ? 1 : 0;
    // drizzle tinyint -> number, type genişletmek için as const yeterli
    conds.push(eq(categories.is_featured, v as unknown as 0 | 1));
  }

  const where = conds.length ? and(...conds) : undefined;

  const base = db.select().from(categories).orderBy(
    asc(categories.display_order),
    desc(categories.created_at),
  );

  const rows = where ? await base.where(where) : await base;
  return reply.send(rows);
};

// GET /categories/:id
export const getCategoryById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// POST /categories
export const createCategory: RouteHandler<{ Body: CategoryCreateInput }> = async (req, reply) => {
  const input = categoryCreateSchema.parse(req.body);

  const id = input.id ?? randomUUID();
  const payload = {
    ...input,
    id,
    // DB zaten default + on update veriyor; biz yine de deterministik set edelim
    updated_at: now(),
  };

  await db.insert(categories).values(payload);
  const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return reply.code(201).send(row);
};

// PATCH /categories/:id
export const updateCategory: RouteHandler<{
  Params: { id: string };
  Body: CategoryUpdateInput;
}> = async (req, reply) => {
  const { id } = req.params;
  const patch = categoryUpdateSchema.parse(req.body);

  const set: Partial<typeof patch> & { updated_at: Date } = { ...patch, updated_at: now() };
  await db.update(categories).set(set).where(eq(categories.id, id));

  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

// DELETE /categories/:id
export const deleteCategory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(categories).where(eq(categories.id, id));
  return reply.code(204).send();
};
