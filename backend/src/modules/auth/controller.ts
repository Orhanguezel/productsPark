import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import '@fastify/jwt';

import { randomUUID, createHash } from 'crypto';
import { db } from '@/db/client';
import { users, refresh_tokens } from './schema';
import { userRoles } from '@/modules/userRoles/schema';
import { desc, eq } from 'drizzle-orm';
import { hash as argonHash, verify as argonVerify } from 'argon2';
import bcrypt from 'bcryptjs';
import { signupBody, tokenBody, updateBody, googleBody } from './validation';
import { env } from '@/core/env';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { profiles } from '@/modules/profiles/schema';

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

/* -------------------- küçük yardımcılar (tip güvenli) -------------------- */

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

function makeGoogleAuthUrl(opts: { clientId: string; redirectUri: string; redirectTo?: string; stateCsrf: string }) {
  const { clientId, redirectUri, redirectTo, stateCsrf } = opts;
  const statePayload = { r: redirectTo || frontendRedirectDefault(), c: stateCsrf };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('include_granted_scopes', 'true');
  u.searchParams.set('prompt', 'select_account');
  u.searchParams.set('state', state);
  return u.toString();
}

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

const ACCESS_MAX_AGE = 60 * 15; // 15 dk
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function cookieBase(devSecure = false) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function setAccessCookie(reply: FastifyReply, token: string) {
  const base = { ...cookieBase(), maxAge: ACCESS_MAX_AGE };
  // iki isim de yazılsın (geçiş dönemi uyumu)
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

async function verifyPasswordSmart(storedHash: string, plain: string): Promise<boolean> {
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plain, storedHash);
  }
  return argonVerify(storedHash, plain);
}

async function getUserRole(userId: string): Promise<Role> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.user_id, userId))
    .orderBy(desc(userRoles.created_at))
    .limit(1);
  return (rows[0]?.role ?? 'user') as Role;
}

/* -------------------- access + refresh üretimi / rotasyonu -------------------- */

async function issueTokens(app: FastifyInstance, u: UserRow, role: Role) {
  const jwt = getJWT(app);
  const access = jwt.sign({ sub: u.id, email: u.email ?? undefined, role }, { expiresIn: `${ACCESS_MAX_AGE}s` });

  const jti = randomUUID();
  const refreshRaw = `${jti}.${randomUUID()}`; // cookie: düz; DB: hash
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

  // revoke eski
  await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, oldJti));

  // yeni üret
  const newJti = randomUUID();
  const newRaw = `${newJti}.${randomUUID()}`;
  await db.insert(refresh_tokens).values({
    id: newJti,
    user_id: userId,
    token_hash: sha256(newRaw),
    expires_at: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
  });

  // zincir
  await db.update(refresh_tokens).set({ replaced_by: newJti }).where(eq(refresh_tokens.id, oldJti));
  return newRaw;
}

/* ================================= CONTROLLER ================================ */

export function makeAuthController(app: FastifyInstance) {
  const jwt = getJWT(app);
  const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  return {
    /* ------------------------------ SIGNUP ------------------------------ */
    // POST /auth/v1/signup
    signup: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = signupBody.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: { message: 'invalid_body' } });

      const { email, password } = parsed.data;

      const meta = (parsed.data.options?.data ?? {}) as Record<string, unknown>;
      const full_name = typeof meta['full_name'] === 'string' ? (meta['full_name'] as string) : undefined;
      const phone = typeof meta['phone'] === 'string' ? (meta['phone'] as string) : undefined;

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

      await db.insert(userRoles).values({
        id: randomUUID(),
        user_id: id,
        role: 'user',
      });

      // profil satırı oluştur
      await ensureProfileRow(id, { full_name: full_name ?? null, phone: phone ?? null });

      // tokenlar
      const u = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]!;
      const role: Role = 'user';
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
      const body = req.body as { grant_type?: string } | undefined;
      if (body?.grant_type !== 'password') {
        return reply.status(400).send({ error: { message: 'unsupported_grant_type' } });
      }

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

      // profil yoksa oluştur (lazy)
      await ensureProfileRow(u.id);

      const role = await getUserRole(u.id);
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
      if (new Date(row.expires_at).getTime() < Date.now())
        return reply.status(401).send({ error: { message: 'refresh_expired' } });
      if (row.token_hash !== sha256(raw)) return reply.status(401).send({ error: { message: 'invalid_refresh' } });

      const u = (await db.select().from(users).where(eq(users.id, row.user_id)).limit(1))[0];
      if (!u) return reply.status(401).send({ error: { message: 'invalid_user' } });

      const role = await getUserRole(u.id);
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

        await db.insert(userRoles).values({
          id: randomUUID(),
          user_id: id,
          role: 'user',
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

      const role = await getUserRole(u.id);
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
    // POST /auth/v1/google/start
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

      const url = makeGoogleAuthUrl({
        clientId,
        redirectUri,
        redirectTo,
        stateCsrf: csrf,
      });

      reply.setCookie('g_csrf', csrf, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 60 * 10,
      });

      return reply.send({ url });
    },

    // GET /auth/v1/google/callback
    googleCallback: async (req: FastifyRequest, reply: FastifyReply) => {
      const q = req.query as Record<string, string | undefined>;
      const code = q.code;
      const stateRaw = q.state;

      if (!code || !stateRaw) return reply.status(400).send({ error: { message: 'missing_code_or_state' } });

      let state: { r?: string; c?: string } = {};
      try {
        state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      } catch {
        return reply.status(400).send({ error: { message: 'invalid_state' } });
      }

      const csrfCookie = (req.cookies as Record<string, string | undefined> | undefined)?.g_csrf;
      if (!csrfCookie || csrfCookie !== state.c) {
        return reply.status(400).send({ error: { message: 'csrf_mismatch' } });
      }

      const clientId = env.GOOGLE_CLIENT_ID!;
      const clientSecret = (env as unknown as Record<string, string>).GOOGLE_CLIENT_SECRET!;
      const base = baseUrlFrom(req);
      const redirectUri = `${base}/auth/v1/google/callback`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenRes.ok) return reply.status(401).send({ error: { message: 'google_token_exchange_failed' } });

      const tokenJson = (await tokenRes.json()) as {
        id_token?: string;
        access_token?: string;
        expires_in?: number;
        token_type?: string;
      };

      if (!tokenJson.id_token) return reply.status(401).send({ error: { message: 'google_no_id_token' } });

      let payload: TokenPayload | null = null;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokenJson.id_token,
          audience: clientId,
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

        await db.insert(userRoles).values({
          id: randomUUID(),
          user_id: id,
          role: 'user',
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

      const role = await getUserRole(u.id);
      const { access, refresh } = await issueTokens(app, u, role);

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);
      reply.clearCookie('g_csrf', { path: '/' });

      const redirectTo = state.r || frontendRedirectDefault();
      return reply.status(302).header('location', redirectTo).send();
    },

    /* ------------------------------ ME ------------------------------ */
    // GET /auth/v1/user
    me: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.status(401).send({ error: { message: 'no_token' } });

      try {
        const p = jwt.verify(token);
        const role = await getUserRole(p.sub);
        return reply.send({ user: { id: p.sub, email: p.email ?? null, role } });
      } catch {
        return reply.status(401).send({ error: { message: 'invalid_token' } });
      }
    },

    /* ------------------------------ STATUS ------------------------------ */
    // GET /auth/v1/status   -> FE için: admin mi? login mi?
    status: async (req: FastifyRequest, reply: FastifyReply) => {
      const token = bearerFrom(req);
      if (!token) return reply.send({ authenticated: false, is_admin: false });

      try {
        const p = jwt.verify(token);
        const role = await getUserRole(p.sub);
        return reply.send({
          authenticated: true,
          is_admin: role === 'admin',
          user: { id: p.sub, email: p.email ?? null, role },
        });
      } catch {
        return reply.send({ authenticated: false, is_admin: false });
      }
    },

    /* ------------------------------ UPDATE ------------------------------ */
    // PUT /auth/v1/user
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

      const role = await getUserRole(p.sub);
      return reply.send({ user: { id: p.sub, email: p.email ?? null, role } });
    },

    /* ------------------------------ LOGOUT ------------------------------ */
    // POST /auth/v1/logout
    logout: async (req: FastifyRequest, reply: FastifyReply) => {
      const raw = ((req.cookies as Record<string, string | undefined> | undefined)?.refresh_token ?? '').trim();
      if (raw.includes('.')) {
        const jti = raw.split('.', 1)[0] ?? '';
        await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, jti));
      }
      clearAuthCookies(reply);
      return reply.status(204).send();
    },

    /* ------------------------------ ADMIN GET ------------------------------ */
    // GET /auth/v1/admin/users/:id
    adminGet: async (req: FastifyRequest, reply: FastifyReply) => {
      const params = req.params as Record<string, string>;
      const id = String(params.id);

      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const u = rows[0];
      if (!u) return reply.status(404).send({ error: { message: 'not_found' } });

      const role = await getUserRole(u.id);
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
  };
}
