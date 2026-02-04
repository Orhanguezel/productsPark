// =============================================================
// FILE: src/modules/auth/admin.controller.ts
// FINAL — Admin Users Controller (argon2 removed, bcryptjs only)
// - users tablosu schema uyumlu, extra kolon yok
// - setPassword: bcryptjs hash + refresh revoke + notif + mail
// =============================================================

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

import { db } from '@/db/client';
import { users, refresh_tokens } from '@/modules/auth/schema';
import { getPrimaryRole } from '@/modules/userRoles/service';
import { userRoles } from '@/modules/userRoles/schema';
import { profiles } from '@/modules/profiles/schema';
import { and, asc, desc, eq, like, type SQL } from 'drizzle-orm';

import { notifications, type NotificationInsert } from '@/modules/notifications/schema';
import { sendPasswordChangedMail } from '@/modules/mail/service';

import {
  adminUsersListQuery,
  adminUserUpdateBody,
  adminUserSetActiveBody,
  adminUserSetRolesBody,
  adminUserSetPasswordBody,
} from '@/modules/auth/validation';

import { pickUserDto, toBool01 } from '@/modules/_shared/_shared';
import { env } from '@/core/env';

type UserRow = typeof users.$inferSelect;

const BCRYPT_ROUNDS = Number((env as unknown as { BCRYPT_ROUNDS?: string }).BCRYPT_ROUNDS ?? '10');

async function hashPasswordBcrypt(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export function makeAdminController(_app: FastifyInstance) {
  return {
    /** GET /admin/users */
    list: async (req: FastifyRequest, reply: FastifyReply) => {
      const q = adminUsersListQuery.parse(req.query ?? {});

      const conds: SQL[] = [];
      if (q.q) conds.push(like(users.email, `%${q.q}%`));
      if (typeof q.is_active === 'boolean') conds.push(eq(users.is_active, q.is_active ? 1 : 0));

      const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

      const sortCol =
        q.sort === 'email'
          ? users.email
          : q.sort === 'last_login_at'
            ? users.last_sign_in_at
            : users.created_at;

      const orderFn = q.order === 'asc' ? asc : desc;

      const base = await db
        .select()
        .from(users)
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(q.limit)
        .offset(q.offset);

      const withRole = await Promise.all(
        base.map(async (u) => ({
          ...u,
          role: await getPrimaryRole(u.id),
        })),
      );

      const filtered = q.role ? withRole.filter((u) => u.role === q.role) : withRole;

      return reply.send(filtered.map((u) => pickUserDto(u, u.role)));
    },

    /** GET /admin/users/:id */
    get: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      const role = await getPrimaryRole(u.id);
      return reply.send(pickUserDto(u, role));
    },

    /** PATCH /admin/users/:id */
    update: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const body = adminUserUpdateBody.parse(req.body ?? {});

      const existing = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!existing) return reply.status(404).send({ error: { message: 'not_found' } });

      const patch: Partial<UserRow> = {
        ...(body.full_name != null ? { full_name: body.full_name } : {}),
        ...(body.phone != null ? { phone: body.phone } : {}),
        ...(body.email != null ? { email: body.email } : {}),
        ...(body.is_active != null ? { is_active: toBool01(body.is_active) ? 1 : 0 } : {}),
        updated_at: new Date(),
      };

      await db.update(users).set(patch).where(eq(users.id, id));

      const updated = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!updated) return reply.status(404).send({ error: { message: 'not_found' } });

      const role = await getPrimaryRole(id);
      return reply.send(pickUserDto(updated, role));
    },

    /** POST /admin/users/:id/active */
    setActive: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { is_active } = adminUserSetActiveBody.parse(req.body ?? {});

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      const active = toBool01(is_active);

      await db
        .update(users)
        .set({
          is_active: active ? 1 : 0,
          ...(active ? { email_verified: 1 } : {}),
          updated_at: new Date(),
        })
        .where(eq(users.id, id));

      return reply.send({ ok: true });
    },

    /** POST /admin/users/:id/roles (tam set) */
    setRoles: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { roles } = adminUserSetRolesBody.parse(req.body ?? {});

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      await db.transaction(async (tx) => {
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        if (roles.length > 0) {
          await tx.insert(userRoles).values(
            roles.map((r) => ({
              id: randomUUID(),
              user_id: id,
              role: r,
            })),
          );
        }
      });

      return reply.send({ ok: true });
    },

    /** POST /admin/users/:id/password */
    setPassword: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);
      const { password } = adminUserSetPasswordBody.parse(req.body ?? {});

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      // ✅ bcryptjs hash (argon2 removed)
      const password_hash = await hashPasswordBcrypt(password);

      // tüm refresh token'ları revoke et (admin reset sonrası güvenlik)
      await db
        .update(refresh_tokens)
        .set({ revoked_at: new Date() })
        .where(eq(refresh_tokens.user_id, id));

      await db
        .update(users)
        .set({
          password_hash,
          is_active: 1,
          email_verified: 1,
          updated_at: new Date(),
        })
        .where(eq(users.id, id));

      // Notification
      try {
        const notif: NotificationInsert = {
          id: randomUUID(),
          user_id: id,
          title: 'Şifreniz güncellendi',
          message:
            'Hesap şifreniz yönetici tarafından güncellendi. Bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.',
          type: 'password_changed',
          is_read: 0,
          created_at: new Date(),
        };
        await db.insert(notifications).values(notif);
      } catch (err: unknown) {
        req.log?.error?.(err, 'admin_password_change_notification_failed');
      }

      // Mail
      if (u.email) {
        const userName =
          (u.full_name && u.full_name.length > 0 ? u.full_name : u.email.split('@')[0]) ||
          'Kullanıcı';

        void sendPasswordChangedMail({
          to: u.email,
          user_name: userName,
          site_name: 'Dijital Market',
        }).catch((err: unknown) => {
          req.log?.error?.(err, 'admin_password_change_mail_failed');
        });
      }

      return reply.send({ ok: true });
    },

    /** DELETE /admin/users/:id */
    remove: async (req: FastifyRequest, reply: FastifyReply) => {
      const id = String((req.params as Record<string, string>).id);

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      await db.transaction(async (tx) => {
        await tx.delete(refresh_tokens).where(eq(refresh_tokens.user_id, id));
        await tx.delete(userRoles).where(eq(userRoles.user_id, id));
        await tx.delete(profiles).where(eq(profiles.id, id));
        await tx.delete(users).where(eq(users.id, id));
      });

      return reply.send({ ok: true });
    },
  };
}
