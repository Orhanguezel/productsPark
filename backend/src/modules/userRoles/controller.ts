// src/modules/userRoles/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq } from 'drizzle-orm';
import { userRoles } from './schema';
import {
  userRoleListQuerySchema,
  createUserRoleSchema,
  type UserRoleListQuery,
  type CreateUserRoleInput,
} from './validation';

export const listUserRoles: RouteHandler = async (req, reply) => {
  const q = userRoleListQuerySchema.parse(req.query ?? {}) as UserRoleListQuery;

  const conds = [];
  if (q.user_id) conds.push(eq(userRoles.user_id, q.user_id));
  if (q.role) conds.push(eq(userRoles.role, q.role));

  let qb = db.select().from(userRoles).$dynamic();

  if (conds.length === 1) qb = qb.where(conds[0]);
  if (conds.length > 1) qb = qb.where(and(...conds));

  const dirFn = q.direction === 'desc' ? desc : asc;
  qb = qb.orderBy(dirFn(userRoles.created_at));

  // default limit 50
  qb = qb.limit(typeof q.limit === 'number' && q.limit > 0 ? q.limit : 50);

  // offset 0 da geçerli olmalı
  if (typeof q.offset === 'number' && q.offset >= 0) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows);
};

export const createUserRole: RouteHandler = async (req, reply) => {
  try {
    const body = createUserRoleSchema.parse(req.body ?? {}) as CreateUserRoleInput;
    const id = randomUUID();

    await db.insert(userRoles).values({ id, user_id: body.user_id, role: body.role });
    const [row] = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'user_role_already_exists' } });
    }
    throw err;
  }
};

export const deleteUserRole: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(userRoles).where(eq(userRoles.id, id));
  return reply.code(204).send();
};
