import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq } from "drizzle-orm";
import { userRoles } from "./schema";
import {
  userRoleListQuerySchema,
  createUserRoleSchema,
  type UserRoleListQuery,
  type CreateUserRoleInput,
} from "./validation";

export const listUserRoles: RouteHandler = async (req, reply) => {
  const q = userRoleListQuerySchema.parse(req.query ?? {}) as UserRoleListQuery;

  const conds: unknown[] = [];
  if (q.user_id) conds.push(eq(userRoles.user_id, q.user_id));
  if (q.role) conds.push(eq(userRoles.role, q.role));

  let qb = db.select().from(userRoles).$dynamic();
  if (conds.length === 1) qb = qb.where(conds[0] as any);
  else if (conds.length > 1) qb = qb.where(and(...(conds as any)));

  const dir = q.direction === "desc" ? "desc" : "asc";
  qb = qb.orderBy(dir === "desc" ? desc(userRoles.created_at) : asc(userRoles.created_at));

  if (q.limit && q.limit > 0) qb = qb.limit(q.limit);
  if (q.offset && q.offset >= 0) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows);
};

export const createUserRole: RouteHandler = async (req, reply) => {
  const body = createUserRoleSchema.parse(req.body ?? {}) as CreateUserRoleInput;
  const id = randomUUID();

  await db.insert(userRoles).values({
    id,
    user_id: body.user_id,
    role: body.role,
  });

  const [row] = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
  return reply.code(201).send(row);
};

export const deleteUserRole: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(userRoles).where(eq(userRoles.id, id));
  return reply.code(204).send();
};
