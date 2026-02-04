// =============================================================
// FILE: src/modules/products/controller.ts
// FINAL — Products Public Controller (list/get) + optional CRUD
// - sales_count supported & normalized
// - review_count preserved (reviews), sales_count is manual sales number
// - safe number/null normalization
// - safe JSON normalization (array/object pass-through)
// - strip undefined on PATCH/INSERT
// - safe min/max price filters
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, desc, eq, inArray, like, sql, asc } from 'drizzle-orm';

import { products, productFaqs, productOptions, productReviews, productStock } from './schema';
import { categories } from '@/modules/categories/schema';

import {
  productCreateSchema,
  productUpdateSchema,
  productFaqCreateSchema,
  productFaqUpdateSchema,
  productOptionCreateSchema,
  productOptionUpdateSchema,
  productReviewCreateSchema,
  productReviewUpdateSchema,
  productStockCreateSchema,
  productStockUpdateSchema,
} from './validation';

import { z } from 'zod';
import { now, toNumber, parseJson, toBool } from '@/modules/_shared/common';

/* ---------------- helpers ---------------- */

type ProductRow = typeof products.$inferSelect;

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = toNumber(v);
  return Number.isFinite(n as number) ? (n as number) : null;
}

function numOr0(v: unknown): number {
  const n = toNumber(v);
  return Number.isFinite(n as number) ? (n as number) : 0;
}

function jsonArrayOrNull<T = unknown>(v: unknown): T[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v as T[];
  const parsed = parseJson<T[]>(v);
  return Array.isArray(parsed) ? parsed : null;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as Array<keyof T>) {
    const v = obj[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function parseIdList(v: unknown, max = 200): string[] {
  if (v == null) return [];

  let raw: unknown[] = [];
  if (Array.isArray(v)) {
    raw = v;
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];

    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) raw = parsed;
      } catch {
        // ignore
      }
    }

    if (!raw.length) {
      raw = s.split(',').map((x) => x.trim());
    }
  } else {
    raw = [v];
  }

  const out = raw
    .map((x) => String(x ?? '').trim())
    .filter(Boolean);

  return Array.from(new Set(out)).slice(0, Math.max(1, max));
}

function normalizeProduct(row: ProductRow) {
  if (!row) return row;

  // Drizzle row is mutable-ish; clone to be safe
  const p: Record<string, unknown> = { ...(row as any) };

  // numbers (nullable decimals keep null)
  p.price = numOr0(p.price);
  p.original_price = numOrNull(p.original_price);
  p.cost = numOrNull(p.cost);

  p.rating = numOr0(p.rating);
  p.review_count = Math.max(0, Math.trunc(numOr0(p.review_count)));

  // ✅ sales_count
  p.sales_count = Math.max(0, Math.trunc(numOr0(p.sales_count)));

  // json
  p.gallery_urls = jsonArrayOrNull<string>(p.gallery_urls);
  p.gallery_asset_ids = jsonArrayOrNull<string>(p.gallery_asset_ids);
  p.features = jsonArrayOrNull<string>(p.features);
  p.custom_fields = parseJson(p.custom_fields);
  p.quantity_options = parseJson(p.quantity_options);
  p.badges = parseJson(p.badges);

  // booleans (tinyint)
  p.is_active = toBool(p.is_active);
  p.is_featured = toBool(p.is_featured);
  p.is_digital = toBool((p as any).is_digital);
  p.requires_shipping = toBool(p.requires_shipping);
  p.article_enabled = toBool(p.article_enabled);
  p.demo_embed_enabled = toBool(p.demo_embed_enabled);
  p.auto_delivery_enabled = toBool((p as any).auto_delivery_enabled);
  p.pre_order_enabled = toBool((p as any).pre_order_enabled);

  // alias
  p.show_on_homepage =
    'show_on_homepage' in p ? toBool((p as any).show_on_homepage) : toBool(p.is_featured);

  // strict ints
  p.stock_quantity = Math.max(0, Math.trunc(numOr0(p.stock_quantity)));

  return p;
}

/* ---------------- list/get ---------------- */

/** GET /products?category_id=&is_active=&is_featured=&q=&limit=&offset=&sort=(price|rating|created_at)&order=(asc|desc|created_at.desc)&slug=&ids= */
export const listProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    category_id?: string;
    is_active?: string;
    is_featured?: string;
    q?: string;
    limit?: string;
    offset?: string;
    sort?: 'price' | 'rating' | 'created_at';
    order?: 'asc' | 'desc' | string;
    slug?: string;
    min_price?: string;
    max_price?: string;
    ids?: string | string[];
  };

  // Single by slug (shortcut)
  if (q.slug) {
    const rows = await db
      .select({
        p: products,
        c: { id: categories.id, name: categories.name, slug: categories.slug },
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(and(eq(products.slug, q.slug), eq(products.is_active, 1 as any)))
      .limit(1);

    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

    const r = rows[0];
    return reply.send({ ...normalizeProduct(r.p as any), categories: r.c });
  }

  // filters
  const conds: any[] = [];

  if (q.category_id) conds.push(eq(products.category_id, q.category_id));

  if (q.is_active !== undefined) {
    const v = q.is_active === '1' || q.is_active === 'true' ? 1 : 0;
    conds.push(eq(products.is_active, v as any));
  }

  if (q.is_featured !== undefined) {
    const v = q.is_featured === '1' || q.is_featured === 'true' ? 1 : 0;
    conds.push(eq(products.is_featured, v as any));
  }

  if (q.q) conds.push(like(products.name, `%${q.q}%`));

  if (q.min_price) {
    const v = Number(q.min_price);
    if (Number.isFinite(v)) conds.push(sql`${products.price} >= ${v}`);
  }
  if (q.max_price) {
    const v = Number(q.max_price);
    if (Number.isFinite(v)) conds.push(sql`${products.price} <= ${v}`);
  }

  const ids = parseIdList(q.ids);
  if (ids.length) {
    conds.push(inArray(products.id, ids));
  }

  const whereExpr = conds.length ? and(...conds) : undefined;

  // pagination
  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  // sorting
  const colMap = {
    price: products.price,
    rating: products.rating,
    created_at: products.created_at,
  } as const;

  let sortKey: keyof typeof colMap = 'created_at';
  let dir: 'asc' | 'desc' = 'desc';

  if (q.sort) {
    sortKey = q.sort;
    dir = q.order === 'asc' ? 'asc' : 'desc';
  } else if (q.order && q.order.includes('.')) {
    const [col, d] = String(q.order).split('.');
    sortKey = (['price', 'rating', 'created_at'] as const).includes(col as any)
      ? (col as keyof typeof colMap)
      : 'created_at';
    dir = d?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  }

  const orderExpr = dir === 'asc' ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  // count
  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(products);
  const [{ total }] = await (whereExpr ? countBase.where(whereExpr) : countBase);

  // data
  const dataBase = db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id));

  const rows = await (whereExpr ? dataBase.where(whereExpr) : dataBase)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  const out = rows.map((r) => ({ ...normalizeProduct(r.p as any), categories: r.c }));

  reply.header('x-total-count', String(Number(total || 0)));
  reply.header('content-range', `*/${Number(total || 0)}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(out);
};

// UUID or slug
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** GET /products/:idOrSlug  */
export const getProductByIdOrSlug: RouteHandler = async (req, reply) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const isUuid = UUID_RE.test(idOrSlug);

  const whereExpr = isUuid
    ? eq(products.id, idOrSlug)
    : and(eq(products.slug, idOrSlug), eq(products.is_active, 1 as any));

  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(whereExpr)
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p as any), categories: r.c });
};

/** Optional legacy: GET /products/id/:id */
export const getProductById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p as any), categories: r.c });
};

/** Optional legacy: GET /products/by-slug/:slug */
export const getProductBySlug: RouteHandler = async (req, reply) => {
  const { slug } = req.params as { slug: string };
  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(and(eq(products.slug, slug), eq(products.is_active, 1 as any)))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p as any), categories: r.c });
};

/* ---------------- optional product CRUD ---------------- */

/** POST /products (kullanmak istemezsen route'a bağlama) */
export const createProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body ?? {});
    const id = input.id ?? randomUUID();

    // sales_count + review_count ayrıştı: ikisi de gelebilir.
    // Eğer FE backward compat ile ikisini birden yolluyorsa sorun yok.
    // Eğer sadece sales_count geldiyse review_count default 0 kalır.

    const values = stripUndefined({
      ...input,
      id,
      created_at: now(),
      updated_at: now(),
    } as any);

    await (db.insert(products) as any).values(values);

    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return reply.code(201).send(normalizeProduct(row as any));
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.code === 'ER_NO_REFERENCED_ROW_2') {
      return reply.code(409).send({
        error: { message: 'fk_category_not_found', details: e.sqlMessage },
      });
    }
    if (e?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({
        error: { message: 'duplicate_slug', details: e.sqlMessage },
      });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/** PATCH /products/:id */
export const updateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    const patch = productUpdateSchema.parse(req.body || {});
    const setObj = stripUndefined({ ...patch, updated_at: now() } as any);

    const res = await (db.update(products) as any).set(setObj).where(eq(products.id, id));

    // id yoksa 404
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(normalizeProduct(rows[0] as any));
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({
        error: { message: 'duplicate_slug', details: e.sqlMessage },
      });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/** DELETE /products/:id */
export const deleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(products) as any).where(eq(products.id, id));
  return reply.code(204).send();
};

/* ===================== */
/* FAQ / OPTIONS / REVIEWS / STOCK (public list + opsiyonel CRUD) */
/* ===================== */

export const listProductFaqs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; only_active?: string };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productFaqs.product_id, q.product_id));
  if (q.only_active === '1' || q.only_active === 'true')
    conds.push(eq(productFaqs.is_active, 1 as any));
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productFaqs);
  const rows = await (whereExpr ? base.where(whereExpr as any) : base).orderBy(
    productFaqs.display_order,
  );
  return reply.send(rows);
};

export const createProductFaq: RouteHandler = async (req, reply) => {
  try {
    const input = productFaqCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productFaqs) as any).values({
      ...stripUndefined(input as any),
      id,
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db.select().from(productFaqs).where(eq(productFaqs.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const updateProductFaq: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productFaqUpdateSchema.parse(req.body || {});
    await (db.update(productFaqs) as any)
      .set(stripUndefined({ ...patch, updated_at: now() } as any))
      .where(eq(productFaqs.id, id));

    const rows = await db.select().from(productFaqs).where(eq(productFaqs.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const deleteProductFaq: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(productFaqs) as any).where(eq(productFaqs.id, id));
  return reply.code(204).send();
};

export const listProductOptions: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string };
  const base = db.select().from(productOptions);
  const rows = await (q.product_id
    ? base.where(eq(productOptions.product_id, q.product_id))
    : base);
  return reply.send(rows);
};

export const createProductOption: RouteHandler = async (req, reply) => {
  try {
    const input = productOptionCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productOptions) as any).values({
      ...stripUndefined(input as any),
      id,
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db.select().from(productOptions).where(eq(productOptions.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const updateProductOption: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productOptionUpdateSchema.parse(req.body || {});
    await (db.update(productOptions) as any)
      .set(stripUndefined({ ...patch, updated_at: now() } as any))
      .where(eq(productOptions.id, id));

    const rows = await db.select().from(productOptions).where(eq(productOptions.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const deleteProductOption: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(productOptions) as any).where(eq(productOptions.id, id));
  return reply.code(204).send();
};

export const listProductReviews: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; only_active?: string };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productReviews.product_id, q.product_id));
  if (q.only_active === '1' || q.only_active === 'true')
    conds.push(eq(productReviews.is_active, 1 as any));
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productReviews);
  const rows = await (whereExpr ? base.where(whereExpr as any) : base).orderBy(
    desc(productReviews.review_date),
  );
  return reply.send(rows);
};

export const createProductReview: RouteHandler = async (req, reply) => {
  try {
    const input = productReviewCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productReviews) as any).values({
      ...stripUndefined(input as any),
      id,
      review_date: (input as any).review_date ?? now(),
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db.select().from(productReviews).where(eq(productReviews.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const updateProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productReviewUpdateSchema.parse(req.body || {});
    await (db.update(productReviews) as any)
      .set(stripUndefined({ ...patch, updated_at: now() } as any))
      .where(eq(productReviews.id, id));

    const rows = await db.select().from(productReviews).where(eq(productReviews.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const deleteProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(productReviews) as any).where(eq(productReviews.id, id));
  return reply.code(204).send();
};

export const listProductStock: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; is_used?: string };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productStock.product_id, q.product_id));
  if (q.is_used !== undefined) {
    const v = q.is_used === '1' || q.is_used === 'true' ? 1 : 0;
    conds.push(eq(productStock.is_used, v as any));
  }
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productStock);
  const rows = await (whereExpr ? base.where(whereExpr as any) : base);
  return reply.send(rows);
};

export const createProductStock: RouteHandler = async (req, reply) => {
  try {
    const input = productStockCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productStock) as any).values({
      ...stripUndefined(input as any),
      id,
      used_at: (input as any).used_at ?? null,
      created_at: now(),
    });
    const [row] = await db.select().from(productStock).where(eq(productStock.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const updateProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productStockUpdateSchema.parse(req.body || {});
    await (db.update(productStock) as any)
      .set(stripUndefined(patch as any))
      .where(eq(productStock.id, id));

    const rows = await db.select().from(productStock).where(eq(productStock.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof z.ZodError)
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const deleteProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(productStock) as any).where(eq(productStock.id, id));
  return reply.code(204).send();
};
