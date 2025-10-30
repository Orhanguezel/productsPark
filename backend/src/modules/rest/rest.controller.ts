import type { FastifyRequest, FastifyReply, RouteHandler } from 'fastify';
import { db } from '@/db/client';
import {
  sql,
  desc,
  asc,
  eq,
  and,
  like,
  gt,
  gte,
  lt,
  lte,
  inArray,
} from 'drizzle-orm';
import { parseLimitOffset, parseOrder } from '@/common/utils/queryParser';
import { setContentRange } from '@/common/utils/contentRange';

import { siteSettings } from '@/modules/siteSettings/schema';
import { categories } from '@/modules/categories/schema';
import { products,productOptions } from '@/modules/products/schema';
import { cartItems } from '@/modules/cart/schema';
import { orders, order_items } from '@/modules/orders/schema';
import { blog_posts } from '@/modules/blog/schema';
import { customPages } from '@/modules/customPages/schema';
import { popups } from '@/modules/popups/schema';
import { topbarSettings } from '@/modules/topbarSettings/schema';
import { userRoles } from '@/modules/userRoles/schema';
import { fakeOrderNotifications } from '@/modules/fakeOrderNotifications/schema';

/** Public tipler (router’da da kullanacağız) */
export type RestParams = { table: string };
export type RestQuery = Record<string, string | undefined>;

/** ------------ helpers ------------- */
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnake = (s: string) =>
  s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '');

const TABLES: Record<string, any> = {
  site_settings: siteSettings,
  categories,
  products,
  cart_items: cartItems,
  orders,
  order_items: order_items,
  product_options: productOptions,
  blog_posts: blog_posts,
  custom_pages: customPages,
  popups,
  topbar_settings: topbarSettings,
  user_roles: userRoles,
  fake_order_notifications: fakeOrderNotifications,
};

function getColumn(table: any, key: string) {
  return table?.[key] ?? table?.[toCamel(key)];
}

function buildWhere(qs: RestQuery, table: any) {
  const parts: any[] = [];
  for (const [key, raw] of Object.entries(qs)) {
    if (!raw) continue;
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;

    const col = getColumn(table, key);
    if (!col) {
      const err: any = new Error(`unknown_column: ${key}`);
      err.statusCode = 400;
      throw err;
    }

    const v = String(raw);
    const cast = (val: string): any => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      const n = Number(val);
      if (!Number.isNaN(n) && val.trim() !== '') return n;
      return val;
    };

    if (v.startsWith('eq.')) parts.push(eq(col, cast(v.slice(3))));
    else if (v.startsWith('gt.')) parts.push(gt(col, cast(v.slice(3))));
    else if (v.startsWith('gte.')) parts.push(gte(col, cast(v.slice(4))));
    else if (v.startsWith('lt.')) parts.push(lt(col, cast(v.slice(3))));
    else if (v.startsWith('lte.')) parts.push(lte(col, cast(v.slice(4))));
    else if (v.startsWith('ilike.')) parts.push(like(col, v.slice(6)));
    else if (v.startsWith('in.(') && v.endsWith(')')) {
      const arr = v
        .slice(3, -1)
        .split(',')
        .map((s) => cast(s.trim()));
      parts.push(inArray(col, arr));
    } else {
      const err: any = new Error(`unsupported_operator: ${key}=${v}`);
      err.statusCode = 400;
      throw err;
    }
  }
  return parts.length ? and(...parts) : undefined;
}

function normalizeRow(tableName: string, row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) out[toSnake(k)] = v;
  if (tableName === 'site_settings' && typeof out['value'] === 'string') {
    try {
      out['value'] = JSON.parse(out['value']);
    } catch {
      if (typeof out['value'] === 'string' && /^".*"$/.test(out['value'])) {
        try {
          out['value'] = JSON.parse(out['value'] as string);
        } catch {}
      }
    }
  }
  return out;
}

/** --- RLS-like: user_id = jwt.sub --- */
const USER_SCOPED: Record<string, string> = {
  cart_items: 'user_id',
  orders: 'user_id',
};

function getJwtSub(req: FastifyRequest): string | null {
  const auth = req.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    // fastify-jwt server instance üzerinden
    // @ts-ignore
    const p: any = (req.server as any).jwt.verify(auth.slice(7));
    return String(p.sub);
  } catch {
    return null;
  }
}

function applyRlsWhere(
  tableName: string,
  table: any,
  where: any,
  req: FastifyRequest,
) {
  const colName = USER_SCOPED[tableName];
  if (!colName) return where;
  const sub = getJwtSub(req);
  if (!sub) return where;
  const col = getColumn(table, colName);
  const rls = eq(col, Number(sub));
  return where ? and(where, rls) : rls;
}

function enforceRlsOnBody(
  tableName: string,
  body: any,
  req: FastifyRequest,
) {
  const colName = USER_SCOPED[tableName];
  if (!colName) return body;
  const sub = getJwtSub(req);
  if (!sub) return body;
  const arr = Array.isArray(body) ? body : [body];
  for (const row of arr) row[colName] = Number(sub);
  return Array.isArray(body) ? arr : arr[0];
}
/** --------- helpers end ---------- */

/** GET /rest/v1/:table */
export const getRest: RouteHandler<{
  Params: RestParams;
  Querystring: RestQuery;
}> = async (req, reply) => {
  const tableName = req.params.table;
  const table = TABLES[tableName];
  if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

  const whereRaw = buildWhere(req.query || {}, table);
  const where = applyRlsWhere(tableName, table, whereRaw, req);
  const order = parseOrder((req.query as any)?.order);
  const { limit, offset } = parseLimitOffset(req.query || {});

  let builder: any = db.select().from(table);
  if (where) builder = builder.where(where);
  if (order) {
    const col = getColumn(table, order.col);
    if (col) builder = builder.orderBy(order.dir === 'desc' ? desc(col) : asc(col));
  }
  const rows = await builder.limit(limit).offset(offset);

  if (req.headers['prefer']?.includes('count=exact')) {
    let countBuilder: any = db.select({ total: sql<number>`COUNT(*)` }).from(table);
    if (where) countBuilder = countBuilder.where(where);
    const [{ total }] = await countBuilder;
    setContentRange(reply, offset, limit, Number(total || 0));
  }

  const select = String((req.query as any)?.select || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const snakeRows = rows.map((r: any) => normalizeRow(tableName, r));
  const projected = !select.length
    ? snakeRows
    : snakeRows.map((r: any) =>
        Object.fromEntries(Object.entries(r).filter(([k]) => select.includes(k))),
      );

  const objectMode = String(req.headers['accept'] || '').includes(
    'application/vnd.pgrst.object+json',
  );
  if (objectMode) {
    if (projected.length === 1) return projected[0];
    if (projected.length === 0) return null;
    return reply
      .code(406)
      .send({ error: { message: 'Results contain multiple rows; expected 1' } });
  }

  return projected;
};

/** POST /rest/v1/:table */
export const postRest: RouteHandler<{
  Params: RestParams;
}> = async (req, reply) => {
  const tableName = req.params.table;
  const table = TABLES[tableName];
  if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

  const enforced = enforceRlsOnBody(tableName, req.body, req);
  const bodyArr = Array.isArray(enforced) ? enforced : [enforced];

  const camelArr = bodyArr.map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v])),
  );

  await (db.insert(table) as any).values(camelArr);

  if (req.headers['prefer']?.includes('return=representation')) {
    return bodyArr; // MVP
  }
  return reply.code(201).send(null);
};

/** PATCH /rest/v1/:table */
export const patchRest: RouteHandler<{
  Params: RestParams;
  Querystring: RestQuery;
}> = async (req, reply) => {
  const tableName = req.params.table;
  const table = TABLES[tableName];
  if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

  const whereRaw = buildWhere(req.query || {}, table);
  const where = applyRlsWhere(tableName, table, whereRaw, req);
  if (!where) return reply.code(400).send({ error: { message: 'missing_filter' } });

  const camelSet = Object.fromEntries(
    Object.entries((req.body as Record<string, any>) || {}).map(([k, v]) => [toCamel(k), v]),
  );

  await (db.update(table) as any).set(camelSet).where(where);

  if (req.headers['prefer']?.includes('return=representation')) {
    const rows = await (db.select().from(table) as any).where(where);
    return rows.map((r: any) => normalizeRow(tableName, r));
  }
  return reply.code(204).send();
};

/** DELETE /rest/v1/:table */
export const deleteRest: RouteHandler<{
  Params: RestParams;
  Querystring: RestQuery;
}> = async (req, reply) => {
  const tableName = req.params.table;
  const table = TABLES[tableName];
  if (!table) return reply.code(404).send({ error: { message: 'table_not_found' } });

  const whereRaw = buildWhere(req.query || {}, table);
  const where = applyRlsWhere(tableName, table, whereRaw, req);
  if (!where) return reply.code(400).send({ error: { message: 'missing_filter' } });

  await (db.delete(table) as any).where(where);
  return reply.code(204).send();
};
