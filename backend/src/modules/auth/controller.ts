// =============================================================
// FILE: src/modules/auth/controller.ts
// FINAL — bcryptjs only (argon2 FULLY removed; cPanel-safe)
// - Hash: bcryptjs
// - Verify: bcryptjs + optional temp-login gate
// - NO legacy argon2 import / dynamic import
// =============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import '@fastify/jwt';

import { randomUUID, createHash } from 'crypto';
import { db } from '@/db/client';
import { users, refresh_tokens } from './schema';
import { userRoles } from '@/modules/userRoles/schema';
import { getPrimaryRole } from '@/modules/userRoles/service';
import { desc, eq, like, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

import {
  signupBody,
  tokenBody,
  updateBody,
  adminListQuery,
  adminRoleBody,
  adminMakeByEmailBody,
  passwordResetRequestBody,
  passwordResetConfirmBody,
} from './validation';

import { env } from '@/core/env';
import { profiles } from '@/modules/profiles/schema';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';
import { sendWelcomeMail, sendPasswordChangedMail } from '@/modules/mail/service';
import { notifications, type NotificationInsert } from '@/modules/notifications/schema';

export type Role = 'admin' | 'moderator' | 'user';

interface JWTPayload {
  sub: string;
  email?: string;
  role?: Role;
  purpose?: 'password_reset';
  iat?: number;
  exp?: number;
}

export interface JWTLike {
  sign: (p: JWTPayload, opts?: { expiresIn?: string | number }) => string;
  verify: (token: string) => JWTPayload;
}

type UserRow = typeof users.$inferSelect;

export type AuthUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  is_active: number;
  email_verified: number;
  roles: Role[];
};

export function getJWT(app: FastifyInstance): JWTLike {
  return (app as unknown as { jwt: JWTLike }).jwt;
}

function getHeader(req: FastifyRequest, name: string): string | undefined {
  const h1 = (req.headers as Record<string, string | string[] | undefined>)[name];
  const raw = (
    req as unknown as { raw?: { headers?: Record<string, string | string[] | undefined> } }
  ).raw;
  const h2 = raw?.headers?.[name];
  const v = h1 ?? h2;
  return Array.isArray(v) ? v[0] : v;
}

function getProtocol(req: FastifyRequest): string {
  return (
    getHeader(req, 'x-forwarded-proto') ||
    (req as unknown as { protocol?: string }).protocol ||
    'http'
  );
}

function getHost(req: FastifyRequest): string {
  return (
    (req as unknown as { hostname?: string }).hostname ||
    getHeader(req, 'x-forwarded-host') ||
    getHeader(req, 'host') ||
    'localhost'
  );
}

export function bearerFrom(req: FastifyRequest): string | null {
  const auth = (req.headers.authorization ?? '') as string;
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
  const token = cookies.access_token ?? cookies.accessToken;
  return token && token.length > 10 ? token : null;
}

export function baseUrlFrom(req: FastifyRequest): string {
  const pub = (env as unknown as Record<string, string | undefined>).PUBLIC_URL;
  if (pub) return pub.replace(/\/+$/, '');
  const proto = getProtocol(req);
  const host = getHost(req);
  return `${proto}://${host}`.replace(/\/+$/, '');
}

export function frontendRedirectDefault(): string {
  return ((env as unknown as Record<string, string | undefined>).FRONTEND_URL || '/').trim();
}

/* -------------------- Profiles -------------------- */

export async function ensureProfileRow(
  userId: string,
  defaults?: { full_name?: string | null; phone?: string | null },
): Promise<void> {
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(profiles).values({
      id: userId,
      full_name: defaults?.full_name ?? null,
      phone: defaults?.phone ?? null,
    });
    return;
  }

  if (defaults && (defaults.full_name || defaults.phone)) {
    await db
      .update(profiles)
      .set({
        ...(defaults.full_name ? { full_name: defaults.full_name } : {}),
        ...(defaults.phone ? { phone: defaults.phone } : {}),
        updated_at: new Date(),
      })
      .where(eq(profiles.id, userId));
  }
}

/* -------------------- JWT & Cookies -------------------- */

const ACCESS_MAX_AGE = 60 * 15; // 15 dk
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function setAccessCookie(reply: FastifyReply, token: string) {
  const base = { ...cookieBase(), maxAge: ACCESS_MAX_AGE };
  reply.setCookie('access_token', token, base);
  reply.setCookie('accessToken', token, base);
}

export function setRefreshCookie(reply: FastifyReply, token: string) {
  const base = { ...cookieBase(), maxAge: REFRESH_MAX_AGE };
  reply.setCookie('refresh_token', token, base);
}

function clearAuthCookies(reply: FastifyReply) {
  const base = { path: '/' };
  reply.clearCookie('access_token', base);
  reply.clearCookie('accessToken', base);
  reply.clearCookie('refresh_token', base);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/* -------------------- Password hashing (bcryptjs) -------------------- */

const BCRYPT_ROUNDS = Number((env as unknown as { BCRYPT_ROUNDS?: string }).BCRYPT_ROUNDS ?? '10');

function isBcryptHash(h: string) {
  return h.startsWith('$2a$') || h.startsWith('$2b$') || h.startsWith('$2y$');
}

async function hashPasswordBcrypt(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

async function verifyPasswordBcrypt(storedHash: string, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, storedHash);
}

/* -------------------- Password verify (dev temp gate + bcrypt only) -------------------- */

async function verifyPasswordSmart(storedHash: string, plain: string): Promise<boolean> {
  const allowTemp =
    String((env as unknown as { ALLOW_TEMP_LOGIN?: string }).ALLOW_TEMP_LOGIN ?? '') === '1';

  if (allowTemp && storedHash.includes('temporary.hash.needs.reset')) {
    const expected = (env as unknown as { TEMP_PASSWORD?: string }).TEMP_PASSWORD || 'admin123';
    return plain === expected;
  }

  // Only bcrypt hashes are accepted
  if (!isBcryptHash(storedHash)) return false;
  return verifyPasswordBcrypt(storedHash, plain);
}

/* -------------------- Roles helpers -------------------- */

async function getRoles(userId: string): Promise<Role[]> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.user_id, userId));

  const set = new Set<Role>();
  for (const r of rows) {
    const v = String(r.role).toLowerCase() as Role;
    if (v === 'admin' || v === 'moderator' || v === 'user') set.add(v);
  }

  if (set.size === 0) return ['user'];
  return Array.from(set);
}

async function buildAuthUser(
  userId: string,
  fallbackEmail: string | null,
): Promise<AuthUser | null> {
  const u = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0] ?? null;
  if (!u) return null;

  const roles = await getRoles(userId);

  return {
    id: u.id,
    email: u.email ?? fallbackEmail ?? null,
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    is_active: u.is_active,
    email_verified: u.email_verified,
    roles,
  };
}

/* -------------------- access + refresh üretimi / rotasyonu -------------------- */

export async function issueTokens(app: FastifyInstance, u: UserRow, role: Role) {
  const jwt = getJWT(app);

  const access = jwt.sign(
    { sub: u.id, email: u.email ?? undefined, role },
    { expiresIn: `${ACCESS_MAX_AGE}s` },
  );

  const jti = randomUUID();
  const refreshRaw = `${jti}.${randomUUID()}`;

  await db.insert(refresh_tokens).values({
    id: jti,
    user_id: u.id,
    token_hash: sha256(refreshRaw),
    expires_at: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
  });

  return { access, refresh: refreshRaw };
}

async function rotateRefresh(oldRaw: string, userId: string) {
  const oldJti = oldRaw.split('.', 1)[0] ?? '';

  await db
    .update(refresh_tokens)
    .set({ revoked_at: new Date() })
    .where(eq(refresh_tokens.id, oldJti));

  const newJti = randomUUID();
  const newRaw = `${newJti}.${randomUUID()}`;

  await db.insert(refresh_tokens).values({
    id: newJti,
    user_id: userId,
    token_hash: sha256(newRaw),
    expires_at: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
  });

  await db.update(refresh_tokens).set({ replaced_by: newJti }).where(eq(refresh_tokens.id, oldJti));
  return newRaw;
}

/* -------------------- Helpers -------------------- */

export function parseAdminEmailAllowlist(): Set<string> {
  const raw = (env as unknown as { AUTH_ADMIN_EMAILS?: string }).AUTH_ADMIN_EMAILS || '';
  const set = new Set<string>();
  raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e) => set.add(e));
  return set;
}

/* ================================= CONTROLLER ================================ */

export function makeAuthController(app: FastifyInstance) {
  const jwt = getJWT(app);
  const adminEmails = parseAdminEmailAllowlist();

  return {
    signup: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = signupBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { email, password } = parsed.data;

      const topFull = parsed.data.full_name;
      const topPhone = parsed.data.phone;
      const meta = (parsed.data.options?.data ?? {}) as Record<string, unknown>;

      const full_name =
        (topFull ??
          (typeof meta.full_name === 'string' ? (meta.full_name as string) : undefined)) ||
        undefined;

      const phone =
        (topPhone ?? (typeof meta.phone === 'string' ? (meta.phone as string) : undefined)) ||
        undefined;

      const exists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (exists.length > 0) return reply.status(409).send({ error: { message: 'user_exists' } });

      const id = randomUUID();
      const password_hash = await hashPasswordBcrypt(password);

      await db.insert(users).values({
        id,
        email,
        password_hash,
        full_name,
        phone,
        is_active: 1,
        email_verified: 0,
      });

      const isAdmin = adminEmails.has(email.toLowerCase());
      await db.insert(userRoles).values({
        id: randomUUID(),
        user_id: id,
        role: isAdmin ? 'admin' : 'user',
      });

      await ensureProfileRow(id, { full_name: full_name ?? null, phone: phone ?? null });

      const userNameForMail = full_name || email.split('@')[0];
      void sendWelcomeMail({
        to: email,
        user_name: userNameForMail,
        user_email: email,
        site_name: 'Dijital Market',
      }).catch((err: unknown) => {
        req.log?.error?.(err, 'welcome_mail_failed');
      });

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]!;
      const primaryRole = (await getPrimaryRole(id)) as Role;
      const { access, refresh } = await issueTokens(app, u, primaryRole);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      const authUser = await buildAuthUser(id, email);
      return reply.send({ access_token: access, token_type: 'bearer', user: authUser });
    },

    token: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = tokenBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { email, password } = parsed.data;

      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const u = found[0];

      if (!u || !(await verifyPasswordSmart(u.password_hash, password))) {
        return reply.status(401).send({ error: { message: 'invalid_credentials' } });
      }

      await db
        .update(users)
        .set({ last_sign_in_at: new Date(), updated_at: new Date() })
        .where(eq(users.id, u.id));

      await ensureProfileRow(u.id);

      const primaryRole = (await getPrimaryRole(u.id)) as Role;
      const { access, refresh } = await issueTokens(app, u, primaryRole);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      const authUser = await buildAuthUser(u.id, u.email ?? null);
      return reply.send({ access_token: access, token_type: 'bearer', user: authUser });
    },

    refresh: async (req: FastifyRequest, reply: FastifyReply) => {
      const raw = (
        (req.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? ''
      ).trim();
      if (!raw.includes('.')) return reply.status(401).send({ error: { message: 'no_refresh' } });

      const jti = raw.split('.', 1)[0] ?? '';
      const row = (
        await db.select().from(refresh_tokens).where(eq(refresh_tokens.id, jti)).limit(1)
      )[0];

      if (!row) return reply.status(401).send({ error: { message: 'invalid_refresh' } });
      if (row.revoked_at) return reply.status(401).send({ error: { message: 'refresh_revoked' } });
      if (new Date(row.expires_at).getTime() < Date.now())
        return reply.status(401).send({ error: { message: 'refresh_expired' } });
      if (row.token_hash !== sha256(raw))
        return reply.status(401).send({ error: { message: 'invalid_refresh' } });

      const u =
        (await db.select().from(users).where(eq(users.id, row.user_id)).limit(1))[0] ?? null;
      if (!u) return reply.status(401).send({ error: { message: 'invalid_user' } });

      const primaryRole = (await getPrimaryRole(u.id)) as Role;

      const access = jwt.sign(
        { sub: u.id, email: u.email ?? undefined, role: primaryRole },
        { expiresIn: `${ACCESS_MAX_AGE}s` },
      );

      const newRaw = await rotateRefresh(raw, u.id);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, newRaw);

      const authUser = await buildAuthUser(u.id, u.email ?? null);
      return reply.send({ access_token: access, token_type: 'bearer', user: authUser });
    },

    passwordResetRequest: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = passwordResetRequestBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ success: false, error: 'invalid_body' });

      const email = parsed.data.email.toLowerCase();
      const u = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0] ?? null;

      if (!u) {
        return reply.send({
          success: true,
          message: 'Eğer bu e-posta ile bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.',
        });
      }

      const resetToken = jwt.sign(
        { sub: u.id, email: u.email ?? undefined, purpose: 'password_reset' as const },
        { expiresIn: '1h' },
      );

      return reply.send({ success: true, token: resetToken });
    },

    passwordResetConfirm: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = passwordResetConfirmBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ success: false, error: 'invalid_body' });

      const { token, password } = parsed.data;

      let payload: JWTPayload;
      try {
        payload = jwt.verify(token);
      } catch {
        return reply.status(400).send({ success: false, error: 'invalid_or_expired_token' });
      }

      if (payload.purpose !== 'password_reset' || !payload.sub) {
        return reply.status(400).send({ success: false, error: 'invalid_token_payload' });
      }

      const u =
        (await db.select().from(users).where(eq(users.id, payload.sub)).limit(1))[0] ?? null;
      if (!u) return reply.status(404).send({ success: false, error: 'user_not_found' });

      const password_hash = await hashPasswordBcrypt(password);

      await db
        .update(refresh_tokens)
        .set({ revoked_at: new Date() })
        .where(eq(refresh_tokens.user_id, u.id));
      await db
        .update(users)
        .set({ password_hash, updated_at: new Date() })
        .where(eq(users.id, u.id));

      try {
        const notif: NotificationInsert = {
          id: randomUUID(),
          user_id: u.id,
          title: 'Şifreniz güncellendi',
          message:
            'Hesap şifreniz başarıyla değiştirildi. Bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.',
          type: 'password_changed',
          is_read: 0,
          created_at: new Date(),
        };
        await db.insert(notifications).values(notif);
      } catch (err: unknown) {
        req.log?.error?.(err, 'password_change_notification_failed');
      }

      if (u.email) {
        const nameFromEmail = u.email.split('@')[0];
        void sendPasswordChangedMail({
          to: u.email,
          user_name: nameFromEmail,
          site_name: 'Dijital Market',
        }).catch((err: unknown) => {
          req.log?.error?.(err, 'password_change_mail_failed');
        });
      }

      return reply.send({ success: true, message: 'Parolanız başarıyla güncellendi.' });
    },

    me: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.status(401).send({ error: { message: 'no_token' } });

      try {
        const p = jwt.verify(token);
        const authUser = await buildAuthUser(p.sub, p.email ?? null);
        if (!authUser) return reply.status(401).send({ error: { message: 'invalid_user' } });
        return reply.send(authUser);
      } catch {
        return reply.status(401).send({ error: { message: 'invalid_token' } });
      }
    },

    status: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.send({ authenticated: false });

      try {
        const p = jwt.verify(token);
        const authUser = await buildAuthUser(p.sub, p.email ?? null);
        if (!authUser) return reply.send({ authenticated: false });
        return reply.send({ authenticated: true, user: authUser });
      } catch {
        return reply.send({ authenticated: false });
      }
    },

    update: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.status(401).send({ error: { message: 'no_token' } });

      let p: JWTPayload;
      try {
        p = jwt.verify(token);
      } catch {
        return reply.status(401).send({ error: { message: 'invalid_token' } });
      }

      const parsed = updateBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { email, password } = parsed.data as { email?: string; password?: string };
      let passwordChanged = false;

      if (email) {
        await db.update(users).set({ email, updated_at: new Date() }).where(eq(users.id, p.sub));
        p.email = email;
      }

      if (password) {
        const password_hash = await hashPasswordBcrypt(password);
        await db
          .update(users)
          .set({ password_hash, updated_at: new Date() })
          .where(eq(users.id, p.sub));
        passwordChanged = true;
      }

      if (passwordChanged) {
        try {
          const notif: NotificationInsert = {
            id: randomUUID(),
            user_id: p.sub,
            title: 'Şifreniz güncellendi',
            message:
              'Hesap şifreniz başarıyla değiştirildi. Bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.',
            type: 'password_changed',
            is_read: 0,
            created_at: new Date(),
          };
          await db.insert(notifications).values(notif);
        } catch (err: unknown) {
          req.log?.error?.(err, 'password_change_notification_failed');
        }

        const targetEmail = email ?? p.email;
        if (targetEmail) {
          const nameFromEmail = targetEmail.split('@')[0];
          void sendPasswordChangedMail({
            to: targetEmail,
            user_name: nameFromEmail,
            site_name: 'Dijital Market',
          }).catch((err: unknown) => {
            req.log?.error?.(err, 'password_change_mail_failed');
          });
        }
      }

      const authUser = await buildAuthUser(p.sub, p.email ?? null);
      return reply.send({ user: authUser });
    },

    logout: async (req: FastifyRequest, reply: FastifyReply) => {
      const raw = (
        (req.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? ''
      ).trim();

      if (raw.includes('.')) {
        const jti = raw.split('.', 1)[0] ?? '';
        await db
          .update(refresh_tokens)
          .set({ revoked_at: new Date() })
          .where(eq(refresh_tokens.id, jti));
      }

      clearAuthCookies(reply);
      return reply.status(204).send();
    },

    adminList: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;
      await requireAdmin(req, reply);
      if (reply.sent) return;

      const q = adminListQuery.parse(req.query ?? {});
      const where = q.q ? like(users.email, `%${q.q}%`) : undefined;

      const rows = await db
        .select()
        .from(users)
        .where(where ? and(where) : undefined)
        .orderBy(desc(users.created_at))
        .limit(q.limit)
        .offset(q.offset);

      const withRole = await Promise.all(
        rows.map(async (u) => {
          const roles = await getRoles(u.id);
          return { ...u, roles };
        }),
      );

      return reply.send(withRole);
    },

    adminGet: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;
      await requireAdmin(req, reply);
      if (reply.sent) return;

      const id = String((req.params as Record<string, string>).id);
      const authUser = await buildAuthUser(id, null);
      if (!authUser) return reply.status(404).send({ error: { message: 'not_found' } });

      return reply.send({ user: authUser });
    },

    adminGrantRole: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;
      await requireAdmin(req, reply);
      if (reply.sent) return;

      const body = adminRoleBody.parse(req.body ?? {});
      let target: UserRow | null = null;

      if (body.user_id) {
        target =
          (await db.select().from(users).where(eq(users.id, body.user_id)).limit(1))[0] ?? null;
      } else if (body.email) {
        target =
          (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
      }

      if (!target) return reply.status(404).send({ error: { message: 'user_not_found' } });

      const roleExists = await db
        .select({ r: userRoles.role })
        .from(userRoles)
        .where(and(eq(userRoles.user_id, target.id), eq(userRoles.role, body.role)))
        .limit(1);

      if (roleExists.length === 0) {
        await db
          .insert(userRoles)
          .values({ id: randomUUID(), user_id: target.id, role: body.role });
      }

      return reply.send({ ok: true });
    },

    adminRevokeRole: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;
      await requireAdmin(req, reply);
      if (reply.sent) return;

      const body = adminRoleBody.parse(req.body ?? {});
      let target: UserRow | null = null;

      if (body.user_id) {
        target =
          (await db.select().from(users).where(eq(users.id, body.user_id)).limit(1))[0] ?? null;
      } else if (body.email) {
        target =
          (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
      }

      if (!target) return reply.status(404).send({ error: { message: 'user_not_found' } });

      await db
        .delete(userRoles)
        .where(and(eq(userRoles.user_id, target.id), eq(userRoles.role, body.role)));
      return reply.send({ ok: true });
    },

    adminMakeByEmail: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply);
      if (reply.sent) return;
      await requireAdmin(req, reply);
      if (reply.sent) return;

      const body = adminMakeByEmailBody.parse(req.body ?? {});
      const u =
        (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
      if (!u) return reply.status(404).send({ error: { message: 'user_not_found' } });

      const exists = await db
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.user_id, u.id), eq(userRoles.role, 'admin')))
        .limit(1);

      if (exists.length === 0) {
        await db.insert(userRoles).values({ id: randomUUID(), user_id: u.id, role: 'admin' });
      }

      return reply.send({ ok: true });
    },
  };
}
