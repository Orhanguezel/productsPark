# productspark-compat-api — Sprint 1 Kod İskeleti

> Amaç: **Supabase uyumlu** (DB/REST, Auth, Storage, Functions) minimum set’i **MariaDB** üzerinde ayağa kaldıracak çalıştırılabilir iskelet.

Aşağıdaki bloklar **dosya içeriği** olarak kopyalanıp ilgili yollara kaydedilebilir.

---

## 1) Proje Ağacı (öneri)
```
api/
  src/
    core/{env.ts, logger.ts, errors.ts}
    db/{client.ts, schema.ts}
    middlewares/{auth.ts}
    utils/{contentRange.ts}
    rest/{queryParser.ts, router.ts}
    auth/{routes.ts}
    storage/{routes.ts}
    functions/{routes.ts, paytr.ts}
    server.ts
```

> `docker`, `package.json`, `.env` vb. dosyalar bir önceki canvas’ta mevcut.

---

## 2) `src/core/env.ts`
```ts
import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 8080),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    name: process.env.DB_NAME || 'app',
  },
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },
  PAYTR: {
    MERCHANT_ID: process.env.PAYTR_MERCHANT_ID || '',
    MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY || '',
    MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT || '',
    BASE_URL: process.env.PAYTR_BASE_URL || 'https://www.paytr.com/odeme',
    OK_URL: process.env.PAYTR_OK_URL || '',
    FAIL_URL: process.env.PAYTR_FAIL_URL || '',
    TEST_MODE: process.env.PAYTR_TEST_MODE || '1',
  },
};
```

---

## 3) `src/db/client.ts`
```ts
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { env } from '../core/env';

export const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  connectionLimit: 10,
  supportBigNumbers: true,
  dateStrings: true,
});

export const db = drizzle(pool);
```

---

## 4) `src/db/schema.ts`
```ts
import {
  mysqlTable, int, varchar, boolean, decimal, json, datetime, text
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 191 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 32 }).default('user').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: datetime('created_at').defaultNow().notNull(),
});

export const profiles = mysqlTable('profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  fullName: varchar('full_name', { length: 191 }),
  phone: varchar('phone', { length: 64 }),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  addressJson: json('address_json'),
  updatedAt: datetime('updated_at').defaultNow().notNull(),
});

export const siteSettings = mysqlTable('site_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 191 }).notNull().unique(),
  value: json('value'),
  updatedAt: datetime('updated_at').defaultNow().notNull(),
});

export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 191 }).notNull(),
  slug: varchar('slug', { length: 191 }).notNull().unique(),
  imageUrl: varchar('image_url', { length: 512 }),
  icon: varchar('icon', { length: 128 }),
  description: text('description'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  orderNo: int('order_no').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: datetime('created_at').defaultNow().notNull(),
});

export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  categoryId: int('category_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 191 }).notNull().unique(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: int('stock').default(0).notNull(),
  imageUrl: varchar('image_url', { length: 512 }),
  images: json('images'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: datetime('created_at').defaultNow().notNull(),
});

export const cartItems = mysqlTable('cart_items', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  productId: int('product_id').notNull(),
  qty: int('qty').default(1).notNull(),
  addedAt: datetime('added_at').defaultNow().notNull(),
});

export const orders = mysqlTable('orders', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 8 }).default('TRY').notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }),
  createdAt: datetime('created_at').defaultNow().notNull(),
  paidAt: datetime('paid_at'),
  note: text('note'),
});

export const orderItems = mysqlTable('order_items', {
  id: int('id').autoincrement().primaryKey(),
  orderId: int('order_id').notNull(),
  productId: int('product_id').notNull(),
  qty: int('qty').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
});
```

---

## 5) `src/middlewares/auth.ts`
```ts
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: { message: 'no_token' } });
  }
  try {
    const token = auth.slice(7);
    const user = (req.server as any).jwt.verify(token);
    (req as any).user = user;
  } catch {
    return reply.code(401).send({ error: { message: 'invalid_token' } });
  }
}
```

---

## 6) `src/utils/contentRange.ts`
```ts
export function setContentRange(reply: any, offset: number, limit: number, total: number) {
  const end = Math.max(0, Math.min(total - 1, offset + limit - 1));
  reply.header('Content-Range', `${offset}-${end}/${total}`);
}
```

---

## 7) `src/rest/queryParser.ts`
```ts
import { sql, like, and, gt, gte, lt, lte, eq, inArray } from 'drizzle-orm';

export type Filter = ReturnType<typeof and> | undefined;

export function parseFilters(qs: Record<string,string|undefined>, table: any): Filter {
  const parts: any[] = [];
  for (const [key, raw] of Object.entries(qs)) {
    if (!raw) continue;
    if (['select','order','limit','offset'].includes(key)) continue;
    const v = String(raw);
    if (v.startsWith('eq.')) parts.push(eq((table as any)[key], cast(v.slice(3))));
    else if (v.startsWith('neq.')) parts.push(sql`${(table as any)[key]} <> ${cast(v.slice(4))}`);
    else if (v.startsWith('gt.')) parts.push(gt((table as any)[key], cast(v.slice(3))));
    else if (v.startsWith('gte.')) parts.push(gte((table as any)[key], cast(v.slice(4))));
    else if (v.startsWith('lt.')) parts.push(lt((table as any)[key], cast(v.slice(3))));
    else if (v.startsWith('lte.')) parts.push(lte((table as any)[key], cast(v.slice(4))));
    else if (v.startsWith('ilike.')) {
      const pattern = v.slice(6);
      parts.push(like((table as any)[key], pattern));
    }
    else if (v.startsWith('in.(') && v.endsWith(')')) {
      const arr = v.slice(3, -1).split(',').map(s => cast(s.trim()));
      parts.push(inArray((table as any)[key], arr));
    }
  }
  return parts.length ? and(...parts) : undefined;
}

export function parseOrder(order?: string) {
  if (!order) return undefined;
  const [col, dir] = order.split('.');
  return { col, dir: (dir === 'desc' ? 'desc' : 'asc') as 'asc'|'desc' };
}

export function parseLimitOffset(q: Record<string,string|undefined>) {
  const limit = clampInt(q.limit, 100, 1, 500);
  const offset = clampInt(q.offset, 0, 0, 1_000_000);
  return { limit, offset };
}

function clampInt(val: string|undefined, def: number, min: number, max: number) {
  const n = Number(val);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function cast(v: string): any {
  if (v === 'true') return true;
  if (v === 'false') return false;
  const n = Number(v);
  if (!Number.isNaN(n) && v.trim() !== '') return n;
  return v;
}
```

---

## 8) `src/rest/router.ts`
```ts
import type { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { sql, desc, asc } from 'drizzle-orm';
import { parseFilters, parseLimitOffset, parseOrder } from './queryParser';
import { setContentRange } from '../utils/contentRange';
import * as T from '../db/schema';
import { requireAuth } from '../middlewares/auth';

const TABLES: Record<string, any> = {
  users: T.users,
  profiles: T.profiles,
  site_settings: T.siteSettings,
  categories: T.categories,
  products: T.products,
  cart_items: T.cartItems,
  orders: T.orders,
  order_items: T.orderItems,
};

export async function registerRest(app: FastifyInstance) {
  // LIST
  app.get('/rest/v1/:table', async (req, reply) => {
    const table = TABLES[(req.params as any).table];
    if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

    const q = req.query as Record<string, string|undefined>;
    const where = parseFilters(q, table);
    const order = parseOrder(q.order);
    const { limit, offset } = parseLimitOffset(q);

    // Build select
    let builder = db.select().from(table);
    if (where) builder = (builder as any).where(where);
    if (order) builder = (builder as any).orderBy(order.dir === 'desc' ? (x: any) => desc((x as any)[order.col]) : (x: any) => asc((x as any)[order.col]));
    const rows = await (builder as any).limit(limit).offset(offset);

    if (req.headers['prefer']?.includes('count=exact')) {
      const [{ total }]: any = await db.execute(sql`SELECT COUNT(*) AS total FROM ${table} ${where ? sql`WHERE ${where}` : sql``}`);
      setContentRange(reply, offset, limit, Number(total || 0));
    }

    // select=col1,col2 desteği: basit projection (JS tarafında)
    const select = (q.select || '').split(',').map((s) => s.trim()).filter(Boolean);
    const data = (!select.length) ? rows : rows.map((r: any) => Object.fromEntries(Object.entries(r).filter(([k]) => select.includes(k))));
    return data;
  });

  // INSERT
  app.post('/rest/v1/:table', { preHandler: [requireAuth] }, async (req, reply) => {
    const table = TABLES[(req.params as any).table];
    if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

    const body = Array.isArray(req.body) ? req.body : [req.body];
    // Drizzle generic insert
    const inserted: any = await (db.insert(table) as any).values(body);

    if (req.headers['prefer']?.includes('return=representation')) {
      // Basitçe son insert id’leri ile tekrar seçelim (INT PK varsayımı)
      // Not: MySQL çoklu insert ID aralığı döndürmez; burada PK alan adını bulmak gerekir
      // MVP: tüm satırları geri döndür (performans kabul)
      return body.map((b: any) => ({ ...b }));
    }
    return reply.code(201).send(null);
  });

  // UPDATE
  app.patch('/rest/v1/:table', { preHandler: [requireAuth] }, async (req, reply) => {
    const table = TABLES[(req.params as any).table];
    if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

    const q = req.query as Record<string, string|undefined>;
    const where = parseFilters(q, table);
    if (!where) return reply.code(400).send({ error: { message: 'missing_filter' } });

    await (db.update(table) as any).set(req.body as any).where(where);

    if (req.headers['prefer']?.includes('return=representation')) {
      const rows = await (db.select().from(table) as any).where(where);
      return rows;
    }
    return reply.code(204).send();
  });

  // DELETE
  app.delete('/rest/v1/:table', { preHandler: [requireAuth] }, async (req, reply) => {
    const table = TABLES[(req.params as any).table];
    if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

    const q = req.query as Record<string, string|undefined>;
    const where = parseFilters(q, table);
    if (!where) return reply.code(400).send({ error: { message: 'missing_filter' } });

    await (db.delete(table) as any).where(where);
    return reply.code(204).send();
  });
}
```

---

## 9) `src/auth/routes.ts`
```ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash, verify } from 'argon2';

const signupBody = z.object({ email: z.string().email(), password: z.string().min(6), data: z.record(z.any()).optional() });
const tokenBody = z.object({ email: z.string().email(), password: z.string().min(6) });
const updateBody = z.object({ email: z.string().email().optional(), user_metadata: z.record(z.any()).optional() });

export async function registerAuth(app: FastifyInstance) {
  // Signup
  app.post('/auth/v1/signup', async (req, reply) => {
    const { email, password } = signupBody.parse(req.body);
    const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (exists) return reply.code(409).send({ error: { message: 'user_exists' } });
    const pw = await hash(password);
    const res: any = await (db.insert(users) as any).values({ email, passwordHash: pw, role: 'user' });
    const user = { id: res.insertId || undefined, email, app_metadata: { provider: 'email' }, user_metadata: {} };
    const access_token = await (app as any).jwt.sign({ sub: String(user.id), email: user.email });
    return { user, access_token, token_type: 'bearer' };
  });

  // Token (password)
  app.post('/auth/v1/token', async (req, reply) => {
    const grant = (req.query as any).grant_type;
    if (grant !== 'password') return reply.code(400).send({ error: { message: 'unsupported_grant_type' } });
    const { email, password } = tokenBody.parse(req.body);
    const u = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!u || !(await verify(u.passwordHash, password))) return reply.code(401).send({ error: { message: 'invalid_credentials' } });
    const access_token = await (app as any).jwt.sign({ sub: String(u.id), email: u.email, role: u.role });
    return { access_token, token_type: 'bearer', user: { id: u.id, email: u.email, app_metadata: { provider: 'email' }, user_metadata: {} } };
  });

  // Me
  app.get('/auth/v1/user', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return reply.code(401).send({ error: { message: 'no_token' } });
    try {
      const payload = (app as any).jwt.verify(auth.slice(7));
      return { user: { id: payload.sub, email: payload.email, app_metadata: { provider: 'email' }, user_metadata: {} } };
    } catch {
      return reply.code(401).send({ error: { message: 'invalid_token' } });
    }
  });

  // Update user
  app.put('/auth/v1/user', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return reply.code(401).send({ error: { message: 'no_token' } });
    let payload: any;
    try { payload = (app as any).jwt.verify(auth.slice(7)); } catch { return reply.code(401).send({ error: { message: 'invalid_token' } }); }
    const body = updateBody.parse(req.body || {});
    if (body.email) {
      await (db.update(users) as any).set({ email: body.email }).where(eq(users.id, Number(payload.sub)));
      payload.email = body.email;
    }
    return { user: { id: payload.sub, email: payload.email, app_metadata: { provider: 'email' }, user_metadata: body.user_metadata || {} } };
  });

  // Logout (no-op)
  app.post('/auth/v1/logout', async (_req, reply) => reply.code(204).send());

  // Recover (password reset kick-off) — functions/send-email ile entegre edilecek
  app.post('/auth/v1/recover', async (_req, reply) => {
    return reply.send({ ok: true });
  });

  // Admin minimal
  app.get('/auth/v1/admin/users/:id', async (req, reply) => {
    const id = Number((req.params as any).id);
    const u = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!u) return reply.code(404).send({ error: { message: 'not_found' } });
    return { user: { id: u.id, email: u.email, app_metadata: { provider: 'email' }, user_metadata: {} } };
  });
}
```

---

## 10) `src/storage/routes.ts`
```ts
import type { FastifyInstance } from 'fastify';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../core/env';

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: env.CLOUDINARY.cloudName,
  api_key: env.CLOUDINARY.apiKey,
  api_secret: env.CLOUDINARY.apiSecret,
});

function toPublicUrl(bucket: string, path: string) {
  if (env.CLOUDINARY.basePublic) {
    return `${env.CLOUDINARY.basePublic}/${bucket}/${path}`.replace(/\\/g, '/');
  }
  return `https://res.cloudinary.com/${env.CLOUDINARY.cloudName}/image/upload/${bucket}/${path}`;
}

export async function registerStorage(app: FastifyInstance) {
  // Upload: POST /storage/v1/object/<bucket>/<path>
  app.post('/storage/v1/object/*', { preHandler: upload.single('file') }, async (req, reply) => {
    const spl = (req.params as any['*']).split('/');
    const bucket = spl.shift();
    const path = spl.join('/');
    if (!req.file) return reply.code(400).send({ error: { message: 'file_required' } });

    const public_id = `${bucket}/${path}`.replace(/\\/g, '/');
    const res = await cloudinary.uploader.upload_stream({ public_id, overwrite: true, resource_type: 'image' }, (err, result) => {
      if (err || !result) return reply.code(500).send({ error: { message: 'upload_failed' } });
      const url = toPublicUrl(bucket!, path!);
      return reply.send({ data: { path, url, key: `${bucket}/${path}` } });
    });
    // pipe buffer
    // @ts-ignore
    res.end((req.file as any).buffer);
  });

  // Public: GET /storage/v1/object/public/<bucket>/<path>
  app.get('/storage/v1/object/public/*', async (req, reply) => {
    const spl = (req.params as any['*']).split('/');
    const bucket = spl.shift();
    const path = spl.join('/');
    const url = toPublicUrl(bucket!, path!);
    return reply.redirect(url);
  });
}
```

> Not: Üretimde Nginx/Proxy ile `/storage/v1/object/public/...` → Cloudinary URL’sine 302/301 redirect yapmak en kestirme yol.

---

## 11) `src/functions/paytr.ts`
```ts
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { env } from '../core/env';

function b64(input: string) {
  return Buffer.from(input, 'utf8').toString('base64');
}

export async function registerPayTR(app: FastifyInstance) {
  app.post('/functions/v1/paytr-get-token', async (req, reply) => {
    const body = req.body as any;
    const merchant_id = env.PAYTR.MERCHANT_ID;
    const merchant_key = env.PAYTR.MERCHANT_KEY;
    const merchant_salt = env.PAYTR.MERCHANT_SALT;

    const email = String(body.email || '');
    const payment_amount = Number(body.payment_amount || 0); // kuruş
    const merchant_oid = String(body.merchant_oid || `OID_${Date.now()}`);
    const user_ip = String(body.user_ip || '127.0.0.1');
    const installment = Number(body.installment ?? 0);
    const no_installment = Number(body.no_installment ?? 0);
    const max_installment = Number(body.max_installment ?? 0);
    const currency = (body.currency || 'TL');
    const test_mode = Number(env.PAYTR.TEST_MODE || 0);

    // Sepet: JSON -> base64
    const basketArr = Array.isArray(body.basket) ? body.basket : [];
    const user_basket = b64(JSON.stringify(basketArr));

    // PayTR hash
    const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = crypto
      .createHmac('sha256', merchant_key)
      .update(hash_str + merchant_salt, 'utf8')
      .digest('base64');

    const payload = {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      user_basket,
      no_installment,
      max_installment,
      currency,
      test_mode,
      paytr_token,
      // opsiyonel alanlar
      installment,
      lang: body.lang || 'tr',
      merchant_ok_url: env.PAYTR.OK_URL,
      merchant_fail_url: env.PAYTR.FAIL_URL,
    };

    // Not: Gerçekte PayTR token endpoint’ine (server-side) POST edilir ve dönen token FE’ye taşınır.
    // Burada sadece imzayı hesaplayıp FE’ye forward edilecek gövdeyi hazırlıyoruz.
    return reply.send({ data: { token: paytr_token, forward_payload: payload, expires_in: 300 } });
  });
}
```

> Not: İsteğe göre sunucudan PayTR API’ye **gerçek istek** atıp dönen `token` FE’ye gönderilebilir. Yukarıdaki iskelet imzayı ve forward edilecek gövdeyi hazırlar.

---

## 12) `src/functions/routes.ts`
```ts
import type { FastifyInstance } from 'fastify';
import { registerPayTR } from './paytr';

export async function registerFunctions(app: FastifyInstance) {
  await registerPayTR(app);
  // send-email, telegram vb. eklenecek
}
```

---

## 13) `src/server.ts` (güncellenmiş)
```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './core/env';
import { registerRest } from './rest/router';
import { registerAuth } from './auth/routes';
import { registerStorage } from './storage/routes';
import { registerFunctions } from './functions/routes';

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.CORS_ORIGIN.length ? env.CORS_ORIGIN : true, credentials: true });
await app.register(jwt, { secret: env.JWT_SECRET });

app.get('/health', async () => ({ ok: true }));

await registerAuth(app);
await registerRest(app);
await registerStorage(app);
await registerFunctions(app);

app.setErrorHandler((err, req, reply) => {
  req.log.error(err);
  const status = err.statusCode || 500;
  reply.code(status).send({ error: { message: err.message } });
});

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch((e) => {
  console.error('Server failed to start', e);
  process.exit(1);
});
```

---

## 14) Notlar & Sonraki Adımlar
- **Insert sonrası return=representation**: Şimdilik gönderilen gövdeyi geri veriyoruz (MVP). P1’de Last Insert ID set’ine göre tekrar select yapılabilir.
- **Relation/nested `select`**: MVP’de düz kolon; P1’de `rel(*)` desteği eklenebilir.
- **Realtime**: P1’de Socket.IO bridge.
- **PayTR gerçek token**: İsteğe bağlı olarak backend → PayTR’a istek atıp dönen token FE’ye iletilebilir.
- **Validasyon**: Zod şemaları kritik uçlarda var; kapsam genişletilecek.



---

## 15) Seed & Demo Data (Scripts)

### 15.1 `src/db/seed.ts`
```ts
import 'dotenv/config';
import { db, pool } from './client';
import { users, profiles, siteSettings, categories, products } from './schema';
import { eq } from 'drizzle-orm';
import { hash } from 'argon2';

async function ensureAdmin(email: string, password: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing.id;
  const passwordHash = await hash(password);
  const res: any = await (db.insert(users) as any).values({ email, passwordHash, role: 'admin', isActive: true });
  return res.insertId || 1;
}

async function ensureCategory(name: string, slug: string, isFeatured = false) {
  const existing = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (existing) return existing.id;
  const res: any = await (db.insert(categories) as any).values({ name, slug, isFeatured, isActive: true });
  return res.insertId;
}

async function ensureProduct(catId: number, title: string, slug: string, price: number, stock = 10) {
  const existing = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (existing) return existing.id;
  const res: any = await (db.insert(products) as any).values({ categoryId: catId, title, slug, price, stock, isActive: true });
  return res.insertId;
}

async function setSetting(key: string, value: any) {
  const existing = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  if (existing) {
    await (db.update(siteSettings) as any).set({ value }).where(eq(siteSettings.id, existing.id));
  } else {
    await (db.insert(siteSettings) as any).values({ key, value });
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const adminId = await ensureAdmin(adminEmail, adminPassword);

  const catFeat = await ensureCategory('Öne Çıkan', 'one-cikan', true);
  const cat2 = await ensureCategory('Aksesuar', 'aksesuar');

  await ensureProduct(catFeat, 'Oyun Mouse', 'oyun-mouse', 499.9, 50);
  await ensureProduct(catFeat, 'Mekanik Klavye', 'mekanik-klavye', 1299.0, 20);
  await ensureProduct(cat2, 'Mouse Pad', 'mouse-pad', 149.0, 100);

  await setSetting('home_header_top_text', 'İndirim Sezonu Başladı');
  await setSetting('home_header_bottom_text', 'Yeni ürünlerde fırsatlar!');
  await setSetting('home_header_sub_text_1', 'Yeni Üyelere Özel');
  await setSetting('home_header_sub_text_2', '%10 Fırsatı Dijimin\'de!');
  await setSetting('home_header_button_text', 'Ürünleri İncele');
  await setSetting('home_header_show_contact', true);
  await setSetting('home_hero_image_url', '');
  await setSetting('home_scroll_content', '<h2>Hesap Satın Al</h2><p>...demo...</p>');
  await setSetting('home_scroll_content_active', true);

  console.log('Seed ok. Admin:', adminEmail, 'UserID:', adminId);
}

main()
  .then(() => pool.end())
  .catch((e) => { console.error(e); pool.end(); process.exit(1); });
```

**package.json script önerisi:**
```json
{
  "scripts": {
    "seed": "tsx src/db/seed.ts"
  }
}
```

**Çalıştırma:**
```bash
cd api
cp .env.example .env # değerleri doldur
npm run dev # (ya da docker compose)
npm run seed
```

---

## 16) RPC Whitelist — `assign_stock_to_order`

### 16.1 `src/rpc/routes.ts`
```ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client';
import { orderItems, orders, products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middlewares/auth';

const bodySchema = z.object({ order_id: z.number().int().positive() });

export async function registerRpc(app: FastifyInstance) {
  app.post('/rest/v1/rpc/assign_stock_to_order', { preHandler: [requireAuth] }, async (req, reply) => {
    const { order_id } = bodySchema.parse(req.body);

    // basit stok rezervasyonu: stok yeterliyse düş, değilse 409
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order_id));
    if (!items.length) return reply.code(404).send({ error: { message: 'order_items_not_found' } });

    try {
      await (db as any).transaction(async (tx: any) => {
        for (const it of items as any[]) {
          const [p] = await tx.select().from(products).where(eq(products.id, it.productId));
          if (!p) throw new Error('product_not_found');
          if (Number(p.stock) < Number(it.qty)) {
            throw new Error(`insufficient_stock:${it.productId}`);
          }
          await (tx.update(products) as any)
            .set({ stock: Number(p.stock) - Number(it.qty) })
            .where(eq(products.id, it.productId));
        }
        await (tx.update(orders) as any).set({ status: 'reserved' }).where(eq(orders.id, order_id));
      });
    } catch (e: any) {
      if (String(e.message || '').startsWith('insufficient_stock')) {
        return reply.code(409).send({ error: { message: e.message } });
      }
      req.log.error(e);
      return reply.code(500).send({ error: { message: 'reserve_failed' } });
    }

    return { ok: true, reserved: items.length };
  });
}
```

### 16.2 `src/server.ts` kayıt
```ts
// ekleyin
import { registerRpc } from './rpc/routes';
...
await registerRpc(app);
```

---

## 17) Postman Koleksiyonu — Ek İstekler
- **REST — orders (list):** `GET /rest/v1/orders?user_id=eq.<id>&order=created_at.desc&limit=10`
- **RPC — assign_stock_to_order:** `POST /rest/v1/rpc/assign_stock_to_order` body: `{ "order_id": 1001 }`
- **Storage — public fetch:** `GET /storage/v1/object/public/product-images/2025/10/test.jpg` (302 → Cloudinary URL)

> Güncellenmiş Postman dosyasını ek olarak paylaşıyorum (v2).

