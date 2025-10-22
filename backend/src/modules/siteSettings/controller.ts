// src/modules/siteSettings/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { eq, like, inArray, asc, desc, and, sql } from 'drizzle-orm';
import { siteSettings } from './schema';
import {
  siteSettingUpsertSchema,
  siteSettingBulkUpsertSchema,
  type JsonLike,
} from './validation';

/** "\"true\"" → true, "{\"a\":1}" → {a:1} ; parse edilemiyorsa string kalır */
function parseDbValue(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}
function stringifyValue(v: JsonLike): string {
  return JSON.stringify(v);
}

/**
 * GET /site_settings
 * Query:
 * - select:   (yok sayılır; FE uyumu)
 * - key:      eşitlik
 * - key_in:   "a,b,c" -> IN(...)
 * - prefix:   LIKE 'prefix%'
 * - order:    "updated_at.desc" | "key.asc" (yoksa key.asc)
 * - limit, offset: sayı
 */
export const listSiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    select?: string;
    key?: string;
    key_in?: string;     // a,b,c
    prefix?: string;
    order?: string;      // col(.desc|.asc)
    limit?: string | number;
    offset?: string | number;
  };

  // Dinamik builder: tip düşürmeleri önlemek için .$dynamic()
  let qb = db.select().from(siteSettings).$dynamic();

  const conditions: unknown[] = [];
  if (q.prefix) conditions.push(like(siteSettings.key, `${q.prefix}%`));
  if (q.key)    conditions.push(eq(siteSettings.key, q.key));
  if (q.key_in) {
    const keys = q.key_in.split(',').map(s => s.trim()).filter(Boolean);
    if (keys.length) conditions.push(inArray(siteSettings.key, keys));
  }

  if (conditions.length === 1) qb = qb.where(conditions[0] as any);
  else if (conditions.length > 1) qb = qb.where(and(...(conditions as any)));

  // order
  if (q.order) {
    const [col, dir] = q.order.split('.');
    const colRef = (siteSettings as any)[col];
    if (colRef) {
      qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));
    } else {
      qb = qb.orderBy(asc(siteSettings.key));
    }
  } else {
    qb = qb.orderBy(asc(siteSettings.key));
  }

  // limit/offset
  if (q.limit != null && q.limit !== '') {
    const n = Number(q.limit);
    if (!Number.isNaN(n) && n > 0) qb = qb.limit(n);
  }
  if (q.offset != null && q.offset !== '') {
    const m = Number(q.offset);
    if (!Number.isNaN(m) && m >= 0) qb = qb.offset(m);
  }

  const rows = await qb;
  const out = rows.map(r => ({
    key: r.key,
    value: parseDbValue(r.value),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  }));

  return reply.send(out);
};

/** GET /site_settings/:key */
export const getSiteSettingByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };

  const rows = await db.select().from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  return reply.send({
    key: r.key,
    value: parseDbValue(r.value),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  });
};

/** PUT /site_settings  body: { key, value } (upsert) */
export const upsertSiteSetting: RouteHandler = async (req, reply) => {
  try {
    const input = siteSettingUpsertSchema.parse(req.body || {});
    const now = new Date();

    await db.insert(siteSettings).values({
      id: randomUUID(),
      key: input.key,
      value: stringifyValue(input.value),
      created_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        value: stringifyValue(input.value),
        updated_at: now,
      },
    });

    const [row] = await db.select().from(siteSettings)
      .where(eq(siteSettings.key, input.key)).limit(1);

    return reply.send({
      key: row.key,
      value: parseDbValue(row.value),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    });
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** PUT /site_settings/bulk  body: { items: [{ key, value }, ...] } */
export const upsertManySiteSettings: RouteHandler = async (req, reply) => {
  try {
    const input = siteSettingBulkUpsertSchema.parse(req.body || {});
    const now = new Date();

    const values = input.items.map((i) => ({
      id: randomUUID(),
      key: i.key,
      value: stringifyValue(i.value),
      created_at: now,
      updated_at: now,
    }));

    await db.insert(siteSettings).values(values)
      .onDuplicateKeyUpdate({
        set: {
          // MariaDB’de VALUES() geçerli.
          value: sql`VALUES(${siteSettings.value})`,
          updated_at: sql`VALUES(${siteSettings.updated_at})`,
        },
      });

    const keys = input.items.map(i => i.key);
    const rows = await db.select().from(siteSettings)
      .where(inArray(siteSettings.key, keys));

    const out = rows.map(r => ({
      key: r.key,
      value: parseDbValue(r.value),
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    }));
    return reply.send(out);
  } catch (e) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error' } });
  }
};

/** DELETE /site_settings/:key */
export const deleteSiteSetting: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
  return reply.code(204).send();
};
