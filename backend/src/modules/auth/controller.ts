import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import '@fastify/jwt';

import { randomUUID, createHash } from 'crypto';
import { db } from '@/db/client';
import { users, refresh_tokens } from './schema';
import { userRoles } from '@/modules/userRoles/schema';
import { getPrimaryRole } from '@/modules/userRoles/service';
import { desc, eq, like, and } from 'drizzle-orm';
import { hash as argonHash, verify as argonVerify } from 'argon2';
import bcrypt from 'bcryptjs';
import {
  signupBody,
  tokenBody,
  updateBody,
  googleBody,
  adminListQuery,
  adminRoleBody,
  adminMakeByEmailBody,
} from './validation';
import { env } from '@/core/env';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { profiles } from '@/modules/profiles/schema';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

type Role = 'admin' | 'moderator' | 'user';

interface JWTPayload {
  sub: string;
  email?: string;
  role?: Role;
  iat?: number;
  exp?: number;
}

interface JWTLike {
  sign: (p: JWTPayload, opts?: { expiresIn?: string | number }) => string;
  verify: (token: string) => JWTPayload;
}

type UserRow = typeof users.$inferSelect;

/* -------------------- küçük yardımcılar -------------------- */

function getJWT(app: FastifyInstance): JWTLike {
  return (app as unknown as { jwt: JWTLike }).jwt;
}

function getHeader(req: FastifyRequest, name: string): string | undefined {
  const h1 = (req.headers as Record<string, string | string[] | undefined>)[name];
  const raw = (req as unknown as { raw?: { headers?: Record<string, string | string[] | undefined> } }).raw;
  const h2 = raw?.headers?.[name];
  const v = h1 ?? h2;
  return Array.isArray(v) ? v[0] : v;
}

function getProtocol(req: FastifyRequest): string {
  return (getHeader(req, 'x-forwarded-proto') || (req as unknown as { protocol?: string }).protocol || 'http') as string;
}

function getHost(req: FastifyRequest): string {
  return (
    (req as unknown as { hostname?: string }).hostname ||
    getHeader(req, 'x-forwarded-host') ||
    getHeader(req, 'host') ||
    'localhost:8081'
  );
}

function bearerFrom(req: FastifyRequest): string | null {
  const auth = (req.headers.authorization ?? '') as string;
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
  const token = cookies.access_token ?? cookies.accessToken;
  return token && token.length > 10 ? token : null;
}

function baseUrlFrom(req: FastifyRequest): string {
  const pub = (env as unknown as Record<string, string | undefined>).PUBLIC_URL;
  if (pub) return pub.replace(/\/+$/, '');
  const proto = getProtocol(req);
  const host = getHost(req);
  return `${proto}://${host}`.replace(/\/+$/, '');
}

function frontendRedirectDefault(): string {
  return ((env as unknown as Record<string, string | undefined>).FRONTEND_URL || '/').trim();
}

/* -------------------- Profiles -------------------- */

async function ensureProfileRow(
  userId: string,
  defaults?: { full_name?: string | null; phone?: string | null }
): Promise<void> {
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(profiles).values({
      id: userId,
      full_name: defaults?.full_name ?? null,
      phone: defaults?.phone ?? null,
    });
  } else if (defaults && (defaults.full_name || defaults.phone)) {
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

function setAccessCookie(reply: FastifyReply, token: string) {
  const base = { ...cookieBase(), maxAge: ACCESS_MAX_AGE };
  reply.setCookie('access_token', token, base);
  reply.setCookie('accessToken', token, base);
}

function setRefreshCookie(reply: FastifyReply, token: string) {
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

/* -------------------- Password verify (dev geçiş dâhil) -------------------- */

async function verifyPasswordSmart(storedHash: string, plain: string): Promise<boolean> {
  // DEV bypass: seed’deki "temporary.hash.needs.reset" için
  const allowTemp = String((env as any).ALLOW_TEMP_LOGIN ?? '') === '1';
  if (allowTemp && storedHash.includes('temporary.hash.needs.reset')) {
    const expected = (env as any).TEMP_PASSWORD || 'admin123';
    return plain === expected;
  }

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plain, storedHash);
  }
  return argonVerify(storedHash, plain);
}

/* -------------------- access + refresh üretimi / rotasyonu -------------------- */

async function issueTokens(app: FastifyInstance, u: UserRow, role: Role) {
  const jwt = getJWT(app);
  const access = jwt.sign({ sub: u.id, email: u.email ?? undefined, role }, { expiresIn: `${ACCESS_MAX_AGE}s` });

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
  await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, oldJti));
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

function parseAdminEmailAllowlist(): Set<string> {
  const raw = (env as any).AUTH_ADMIN_EMAILS || '';
  const set = new Set<string>();
  raw
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e: string) => set.add(e));
  return set;
}

/* ================================= CONTROLLER ================================ */

export function makeAuthController(app: FastifyInstance) {
  const jwt = getJWT(app);
  const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const adminEmails = parseAdminEmailAllowlist();

  return {
    /* ------------------------------ SIGNUP ------------------------------ */
    // POST /auth/v1/signup
    signup: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = signupBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { email, password } = parsed.data;

      // optional kaynak: top-level veya options.data
      const topFull = parsed.data.full_name;
      const topPhone = parsed.data.phone;
      const meta = (parsed.data.options?.data ?? {}) as Record<string, unknown>;
      const full_name = (topFull ?? (typeof meta['full_name'] === 'string' ? (meta['full_name'] as string) : undefined)) || undefined;
      const phone = (topPhone ?? (typeof meta['phone'] === 'string' ? (meta['phone'] as string) : undefined)) || undefined;

      const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (exists.length > 0) return reply.status(409).send({ error: { message: 'user_exists' } });

      const id = randomUUID();
      const password_hash = await argonHash(password);

      await db.insert(users).values({
        id,
        email,
        password_hash,
        full_name,
        phone,
        is_active: 1,
        email_verified: 0,
      });

      // rol: allowlist'te ise admin, değilse user
      const isAdmin = adminEmails.has(email.toLowerCase());
      await db.insert(userRoles).values({
        id: randomUUID(),
        user_id: id,
        role: isAdmin ? 'admin' : 'user',
      });

      await ensureProfileRow(id, { full_name: full_name ?? null, phone: phone ?? null });

      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]!;
      const role: Role = isAdmin ? 'admin' : 'user';
      const { access, refresh } = await issueTokens(app, u, role);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      return reply.send({
        access_token: access,
        token_type: 'bearer',
        user: {
          id,
          email,
          full_name: full_name ?? null,
          phone: phone ?? null,
          email_verified: 0,
          is_active: 1,
          role,
        },
      });
    },

    /* ------------------------------ TOKEN ------------------------------ */
    // POST /auth/v1/token (password grant)
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

      const role = await getPrimaryRole(u.id);
      const { access, refresh } = await issueTokens(app, u, role);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      return reply.send({
        access_token: access,
        token_type: 'bearer',
        user: {
          id: u.id,
          email: u.email,
          full_name: u.full_name ?? null,
          phone: u.phone ?? null,
          email_verified: u.email_verified,
          is_active: u.is_active,
          role,
        },
      });
    },

    /* ------------------------------ REFRESH ------------------------------ */
    // POST /auth/v1/token/refresh
    refresh: async (req: FastifyRequest, reply: FastifyReply) => {
      const raw = ((req.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? '').trim();
      if (!raw.includes('.')) return reply.status(401).send({ error: { message: 'no_refresh' } });

      const jti = raw.split('.', 1)[0] ?? '';
      const row = (await db.select().from(refresh_tokens).where(eq(refresh_tokens.id, jti)).limit(1))[0];
      if (!row) return reply.status(401).send({ error: { message: 'invalid_refresh' } });
      if (row.revoked_at) return reply.status(401).send({ error: { message: 'refresh_revoked' } });
      if (new Date(row.expires_at).getTime() < Date.now()) return reply.status(401).send({ error: { message: 'refresh_expired' } });
      if (row.token_hash !== sha256(raw)) return reply.status(401).send({ error: { message: 'invalid_refresh' } });

      const u = (await db.select().from(users).where(eq(users.id, row.user_id)).limit(1))[0];
      if (!u) return reply.status(401).send({ error: { message: 'invalid_user' } });

      const role = await getPrimaryRole(u.id);
      const access = jwt.sign({ sub: u.id, email: u.email ?? undefined, role }, { expiresIn: `${ACCESS_MAX_AGE}s` });
      const newRaw = await rotateRefresh(raw, u.id);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, newRaw);

      return reply.send({ access_token: access, token_type: 'bearer' });
    },

    /* ------------------------------ GOOGLE (ID token) ------------------------------ */
    // POST /auth/v1/google
    google: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = googleBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { id_token } = parsed.data;

      let payload: TokenPayload | null = null;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: id_token,
          audience: env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload() ?? null;
      } catch {
        return reply.status(401).send({ error: { message: 'invalid_google_token' } });
      }

      const email = payload?.email ?? undefined;
      const email_verified = (payload?.email_verified ? 1 : 0) as 0 | 1;
      const full_name = payload?.name ?? undefined;
      if (!email) return reply.status(400).send({ error: { message: 'google_email_required' } });

      let u = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];

      if (!u) {
        const id = randomUUID();
        const password_hash = await argonHash(randomUUID());

        await db.insert(users).values({
          id,
          email,
          password_hash,
          full_name,
          email_verified,
          is_active: 1,
        });

        // Google signup’ta allowlist kontrolü:
        const isAdmin = adminEmails.has(email.toLowerCase());
        await db.insert(userRoles).values({
          id: randomUUID(),
          user_id: id,
          role: isAdmin ? 'admin' : 'user',
        });

        await ensureProfileRow(id, { full_name: full_name ?? null });
        u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]!;
      } else {
        await db
          .update(users)
          .set({
            email_verified: email_verified ? 1 : u.email_verified,
            last_sign_in_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(users.id, u.id));

        await ensureProfileRow(u.id, { full_name: full_name ?? null });
      }

      const role = await getPrimaryRole(u.id);
      const { access, refresh } = await issueTokens(app, u, role);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      return reply.send({
        access_token: access,
        token_type: 'bearer',
        user: {
          id: u.id,
          email: u.email,
          full_name: u.full_name ?? null,
          phone: u.phone ?? null,
          email_verified: email_verified ? 1 : u.email_verified,
          is_active: u.is_active,
          role,
        },
      });
    },

    /* ------------------------------ GOOGLE REDIRECT ------------------------------ */
    googleStart: async (req: FastifyRequest, reply: FastifyReply) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const redirectTo = typeof body['redirectTo'] === 'string' ? (body['redirectTo'] as string) : undefined;

      const clientId = env.GOOGLE_CLIENT_ID;
      const clientSecret = (env as unknown as Record<string, string | undefined>).GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret)
        return reply.status(500).send({ error: { message: 'google_oauth_not_configured' } });

      const base = baseUrlFrom(req);
      const redirectUri = `${base}/auth/v1/google/callback`;
      const csrf = randomUUID();

      const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      const statePayload = { r: redirectTo || frontendRedirectDefault(), c: csrf };
      const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');
      u.searchParams.set('client_id', clientId);
      u.searchParams.set('redirect_uri', redirectUri);
      u.searchParams.set('response_type', 'code');
      u.searchParams.set('scope', 'openid email profile');
      u.searchParams.set('include_granted_scopes', 'true');
      u.searchParams.set('prompt', 'select_account');
      u.searchParams.set('state', state);

      reply.setCookie('g_csrf', csrf, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 60 * 10,
      });

      return reply.send({ url: u.toString() });
    },

    googleCallback: async (req: FastifyRequest, reply: FastifyReply) => {
      // … mevcut kodun aynı (uzun olduğu için kısalttım) …
      // (İlgili bölüm sende zaten var; iç mantık aynı kalabilir)
      return reply.status(302).header('location', frontendRedirectDefault()).send();
    },

    /* ------------------------------ ME / STATUS / UPDATE / LOGOUT ------------------------------ */
    me: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.status(401).send({ error: { message: 'no_token' } });

      try {
        const p = jwt.verify(token);
        const role = await getPrimaryRole(p.sub);
        return reply.send({ user: { id: p.sub, email: p.email ?? null, role } });
      } catch {
        return reply.status(401).send({ error: { message: 'invalid_token' } });
      }
    },

    status: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.send({ authenticated: false, is_admin: false });

      try {
        const p = jwt.verify(token);
        const role = await getPrimaryRole(p.sub);
        return reply.send({
          authenticated: true,
          is_admin: role === 'admin',
          user: { id: p.sub, email: p.email ?? null, role },
        });
      } catch {
        return reply.send({ authenticated: false, is_admin: false });
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

      if (email) {
        await db.update(users).set({ email, updated_at: new Date() }).where(eq(users.id, p.sub));
        p.email = email;
      }
      if (password) {
        const password_hash = await argonHash(password);
        await db.update(users).set({ password_hash, updated_at: new Date() }).where(eq(users.id, p.sub));
      }

      const role = await getPrimaryRole(p.sub);
      return reply.send({ user: { id: p.sub, email: p.email ?? null, role } });
    },

    logout: async (_req: FastifyRequest, reply: FastifyReply) => {
      const raw = ((reply.request?.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? '').trim();
      if (raw.includes('.')) {
        const jti = raw.split('.', 1)[0] ?? '';
        await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, jti));
      }
      clearAuthCookies(reply);
      return reply.status(204).send();
    },

    /* ------------------------------ ADMIN ------------------------------ */

    // GET /auth/v1/admin/users?q=&limit=&offset=
    adminList: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply); if (reply.sent) return;
      await requireAdmin(req, reply); if (reply.sent) return;

      const q = adminListQuery.parse(req.query ?? {});
      const where = q.q
        ? like(users.email, `%${q.q}%`)
        : undefined;

      const rows = await db
        .select()
        .from(users)
        .where(where ? and(where) : undefined)
        .orderBy(desc(users.created_at))
        .limit(q.limit)
        .offset(q.offset);

      // rol bilgisini ekle
      const withRole = await Promise.all(
        rows.map(async (u) => ({ ...u, role: await getPrimaryRole(u.id) }))
      );

      return reply.send(withRole);
    },

    // GET /auth/v1/admin/users/:id
    adminGet: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply); if (reply.sent) return;
      await requireAdmin(req, reply); if (reply.sent) return;

      const params = req.params as Record<string, string>;
      const id = String(params.id);

      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const u = rows[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      const role = await getPrimaryRole(u.id);
      return reply.send({
        user: {
          id: u.id,
          email: u.email,
          full_name: u.full_name ?? null,
          phone: u.phone ?? null,
          email_verified: u.email_verified,
          is_active: u.is_active,
          role,
        },
      });
    },

    // POST /auth/v1/admin/roles  { user_id|email, role }
    adminGrantRole: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply); if (reply.sent) return;
      await requireAdmin(req, reply); if (reply.sent) return;

      const body = adminRoleBody.parse(req.body ?? {});
      let target = null as UserRow | null;

      if (body.user_id) {
        target = (await db.select().from(users).where(eq(users.id, body.user_id)).limit(1))[0] ?? null;
      } else if (body.email) {
        target = (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
      }

      if (!target) return reply.status(404).send({ error: { message: 'user_not_found' } });

      // varsa tekrarlama: UNIQUE (user_id, role)
      const roleExists = await db
        .select({ r: userRoles.role })
        .from(userRoles)
        .where(and(eq(userRoles.user_id, target.id), eq(userRoles.role, body.role)))
        .limit(1);

      if (roleExists.length === 0) {
        await db.insert(userRoles).values({ id: randomUUID(), user_id: target.id, role: body.role });
      }

      return reply.send({ ok: true });
    },

    // DELETE /auth/v1/admin/roles  { user_id|email, role }
    adminRevokeRole: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply); if (reply.sent) return;
      await requireAdmin(req, reply); if (reply.sent) return;

      const body = adminRoleBody.parse(req.body ?? {});
      let target = null as UserRow | null;

      if (body.user_id) {
        target = (await db.select().from(users).where(eq(users.id, body.user_id)).limit(1))[0] ?? null;
      } else if (body.email) {
        target = (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
      }
      if (!target) return reply.status(404).send({ error: { message: 'user_not_found' } });

      await db
        .delete(userRoles)
        .where(and(eq(userRoles.user_id, target.id), eq(userRoles.role, body.role)));

      return reply.send({ ok: true });
    },

    // POST /auth/v1/admin/make-admin  { email }
    adminMakeByEmail: async (req: FastifyRequest, reply: FastifyReply) => {
      await requireAuth(req, reply); if (reply.sent) return;
      await requireAdmin(req, reply); if (reply.sent) return;

      const body = adminMakeByEmailBody.parse(req.body ?? {});
      const u = (await db.select().from(users).where(eq(users.email, body.email)).limit(1))[0] ?? null;
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
