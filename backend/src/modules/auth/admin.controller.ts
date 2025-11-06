// src/modules/auth/admin.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { users, refresh_tokens } from "@/modules/auth/schema";
import { getPrimaryRole } from "@/modules/userRoles/service";
import { userRoles } from "@/modules/userRoles/schema";
import { profiles } from "@/modules/profiles/schema";
import { and, asc, desc, eq, like } from "drizzle-orm";

/** Ortak tipler */
type UserRow = typeof users.$inferSelect;

const toBool = (v: unknown): boolean =>
  typeof v === "boolean" ? v : Number(v) === 1;

const toNum = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));


/** Zod şemaları */
const listQuery = z.object({
  q: z.string().optional(),
  role: z.enum(["admin", "moderator", "user"]).optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  sort: z.enum(["created_at", "email", "last_login_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const updateUserBody = z
  .object({
    full_name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(6).max(50).optional(),
    is_active: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  })
  .strict();

const setActiveBody = z.object({
  is_active: z.union([z.boolean(), z.number().int().min(0).max(1)]),
});

const setRolesBody = z.object({
  roles: z.array(z.enum(["admin", "moderator", "user"])).default([]),
});

export function makeAdminController(_app: FastifyInstance) {
  return {
    /** GET /admin/users */
    list: async (req: FastifyRequest, reply: FastifyReply) => {
      const q = listQuery.parse(req.query ?? {});

      const conds: any[] = [];
      if (q.q) conds.push(like(users.email, `%${q.q}%`));
      if (typeof q.is_active === "boolean") conds.push(eq(users.is_active, q.is_active ? 1 : 0));
      const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

      const sortCol =
        q.sort === "email" ? users.email
        : q.sort === "last_login_at" ? users.last_sign_in_at
        : users.created_at;
      const orderFn = q.order === "asc" ? asc : desc;

      const base = await db
        .select()              // wallet_balance zaten users satırında
        .from(users)
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(q.limit)
        .offset(q.offset);

      const withRole = await Promise.all(
        base.map(async (u) => ({
          ...u,
          role: await getPrimaryRole(u.id),
        }))
      );

      // (opsiyonel) role filtresi
      const filtered = q.role ? withRole.filter((u) => u.role === q.role) : withRole;

      // 👉 FE için wallet_balance'ı number olarak gönder
      const out = filtered.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        phone: u.phone ?? null,
        email_verified: u.email_verified,
        is_active: u.is_active,
        created_at: u.created_at,
        last_login_at: u.last_sign_in_at,
        role: (u as any).role,
        wallet_balance: toNum(u.wallet_balance),
      }));

      return reply.send(out);
    },

    /** GET /admin/users/:id */
    get: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: "not_found" } });

      const role = await getPrimaryRole(u.id);

      // 👉 Burada da wallet_balance number olarak dön
      return reply.send({
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        phone: u.phone ?? null,
        email_verified: u.email_verified,
        is_active: u.is_active,
        created_at: u.created_at,
        last_login_at: u.last_sign_in_at,
        role,
        wallet_balance: toNum(u.wallet_balance),
      });
    },

    /** PATCH /admin/users/:id */
    update: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const body = updateUserBody.parse(req.body ?? {});
      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: "not_found" } });

      const patch: Partial<UserRow> = {
        ...(body.full_name ? { full_name: body.full_name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.is_active != null ? { is_active: toBool(body.is_active) ? 1 : 0 } : {}),
        updated_at: new Date(),
      };

      await db.update(users).set(patch).where(eq(users.id, id));
      const role = await getPrimaryRole(id);

      return reply.send({ ok: true, id, role });
    },


    /** POST /admin/users/:id/active  { is_active } */
    setActive: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { is_active } = setActiveBody.parse(req.body ?? {});
      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u) return reply.status(404).send({ error: { message: "not_found" } });

      await db
        .update(users)
        .set({ is_active: toBool(is_active) ? 1 : 0, updated_at: new Date() })
        .where(eq(users.id, id));

      return reply.send({ ok: true });
    },

    /** POST /admin/users/:id/roles  { roles: string[] }  (tam set) */
    setRoles: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { roles } = setRolesBody.parse(req.body ?? {});
      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u) return reply.status(404).send({ error: { message: "not_found" } });

      await db.transaction(async (tx) => {
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        if (roles.length > 0) {
          await tx.insert(userRoles).values(
            roles.map((r) => ({ id: randomUUID(), user_id: id, role: r }))
          );
        }
      });

      return reply.send({ ok: true });
    },

    /** DELETE /admin/users/:id */
    remove: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);

      const u = (
        await db.select().from(users).where(eq(users.id, id)).limit(1)
      )[0];
      if (!u) return reply.status(404).send({ error: { message: "not_found" } });

      await db.transaction(async (tx) => {
        await tx.delete(refresh_tokens).where(eq(refresh_tokens.user_id, id));
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        await tx.delete(profiles).where(eq(profiles.id, id));
        // TODO: orders, wallet_transactions, support_tickets vs. burada temizlenebilir.
        await tx.delete(users).where(eq(users.id, id));
      });

      return reply.send({ ok: true });
    },
  };
}
