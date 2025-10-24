import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, desc, eq, like } from 'drizzle-orm';
import {
  products,
  productFaqs,
  productOptions,
  productReviews,
  productStock,
} from './schema';
import { categories } from '../categories/schema';
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

/** helpers */
const now = () => new Date();

// DECIMAL string → number (FE rahat etsin)
function toNumber(x: any) {
  if (x === null || x === undefined) return x as any;
  const n = Number(x);
  return Number.isNaN(n) ? x : n;
}

function normalizeProduct(row: any) {
  if (!row) return row;
  const p = { ...row };
  p.price = toNumber(p.price);
  p.original_price = toNumber(p.original_price);
  p.cost = toNumber(p.cost);
  p.rating = toNumber(p.rating);
  return p;
}

/* ========== PRODUCTS ========== */

/** GET /products?category_id=&is_active=&q=&limit=&offset=&sort=(price|rating|created_at)&order=(asc|desc) */
export const listProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    category_id?: string;
    is_active?: string;
    q?: string;
    limit?: string;
    offset?: string;
    sort?: 'price' | 'rating' | 'created_at';
    order?: 'asc' | 'desc';
    slug?: string; // opsiyonel
  };

  // Tek ürün slug ile istenirse (FE bazı yerlerde slug ile fetch ediyor)
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
    const out = { ...normalizeProduct(r.p), categories: r.c };
    return reply.send(out);
  }

  const conds = [];
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.is_active !== undefined) {
    const v = q.is_active === '1' || q.is_active === 'true' ? 1 : 0;
    conds.push(eq(products.is_active, v as any));
  } else {
    // FE liste hep aktif bekliyor
    conds.push(eq(products.is_active, 1 as any));
  }
  if (q.q) conds.push(like(products.name, `%${q.q}%`));

  const where = conds.length ? and(...conds) : undefined;

  const limit = q.limit ? Math.min(parseInt(q.limit, 10), 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10), 0) : 0;

  const sortCol =
    q.sort === 'price' ? products.price :
    q.sort === 'rating' ? products.rating :
    products.created_at;

  const orderer = (q.order === 'asc' ? (c: any) => c : (c: any) => desc(c))(sortCol);

  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(where)
    .orderBy(orderer)
    .limit(limit)
    .offset(offset);

  const out = rows.map((r) => ({ ...normalizeProduct(r.p), categories: r.c }));
  return reply.send(out);
};

/** GET /products/:id */
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
  return reply.send({ ...normalizeProduct(r.p), categories: r.c });
};

/** GET /products/by-slug/:slug */
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
  return reply.send({ ...normalizeProduct(r.p), categories: r.c });
};

/** POST /products */
export const createProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();

    await (db.insert(products) as any).values({
      ...input,
      id,
      created_at: now(),
      updated_at: now(),
    });

    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return reply.code(201).send(normalizeProduct(row));
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

/** PATCH /products/:id */
export const updateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productUpdateSchema.parse(req.body || {});
    await (db.update(products) as any).set({ ...patch, updated_at: now() }).where(eq(products.id, id));

    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(normalizeProduct(rows[0]));
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

/** DELETE /products/:id */
export const deleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(products) as any).where(eq(products.id, id));
  return reply.code(204).send();
};

/* ========== PRODUCT FAQS ========== */

export const listProductFaqs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; only_active?: string };
  const conds = [];
  if (q.product_id) conds.push(eq(productFaqs.product_id, q.product_id));
  if (q.only_active === '1' || q.only_active === 'true') conds.push(eq(productFaqs.is_active, 1 as any));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await (db.select().from(productFaqs) as any)
    .where(where)
    .orderBy(productFaqs.display_order);

  return reply.send(rows);
};

export const createProductFaq: RouteHandler = async (req, reply) => {
  try {
    const input = productFaqCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productFaqs) as any).values({ ...input, id });
    const [row] = await db.select().from(productFaqs).where(eq(productFaqs.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const updateProductFaq: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productFaqUpdateSchema.parse(req.body || {});
    await (db.update(productFaqs) as any).set(patch).where(eq(productFaqs.id, id));
    const rows = await db.select().from(productFaqs).where(eq(productFaqs.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const deleteProductFaq: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productFaqs) as any).where(eq(productFaqs.id, id));
  return reply.code(204).send();
};

/* ========== PRODUCT OPTIONS ========== */

export const listProductOptions: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string };
  const rows = await (db.select().from(productOptions) as any)
    .where(q.product_id ? eq(productOptions.product_id, q.product_id) : undefined);
  return reply.send(rows);
};

export const createProductOption: RouteHandler = async (req, reply) => {
  try {
    const input = productOptionCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productOptions) as any).values({ ...input, id });
    const [row] = await db.select().from(productOptions).where(eq(productOptions.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const updateProductOption: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productOptionUpdateSchema.parse(req.body || {});
    await (db.update(productOptions) as any).set(patch).where(eq(productOptions.id, id));
    const rows = await db.select().from(productOptions).where(eq(productOptions.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const deleteProductOption: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productOptions) as any).where(eq(productOptions.id, id));
  return reply.code(204).send();
};

/* ========== PRODUCT REVIEWS ========== */

export const listProductReviews: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; only_active?: string };
  const conds = [];
  if (q.product_id) conds.push(eq(productReviews.product_id, q.product_id));
  if (q.only_active === '1' || q.only_active === 'true') conds.push(eq(productReviews.is_active, 1 as any));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await (db.select().from(productReviews) as any)
    .where(where)
    .orderBy(desc(productReviews.review_date));
  return reply.send(rows);
};

export const createProductReview: RouteHandler = async (req, reply) => {
  try {
    const input = productReviewCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productReviews) as any).values({ ...input, id, review_date: input.review_date ?? now() });
    const [row] = await db.select().from(productReviews).where(eq(productReviews.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const updateProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productReviewUpdateSchema.parse(req.body || {});
    await (db.update(productReviews) as any).set(patch).where(eq(productReviews.id, id));
    const rows = await db.select().from(productReviews).where(eq(productReviews.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const deleteProductReview: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productReviews) as any).where(eq(productReviews.id, id));
  return reply.code(204).send();
};

/* ========== PRODUCT STOCK ========== */

export const listProductStock: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; is_used?: string };
  const conds = [];
  if (q.product_id) conds.push(eq(productStock.product_id, q.product_id));
  if (q.is_used !== undefined) {
    const v = q.is_used === '1' || q.is_used === 'true' ? 1 : 0;
    conds.push(eq(productStock.is_used, v as any));
  }
  const where = conds.length ? and(...conds) : undefined;

  const rows = await (db.select().from(productStock) as any).where(where);
  return reply.send(rows);
};

export const createProductStock: RouteHandler = async (req, reply) => {
  try {
    const input = productStockCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productStock) as any).values({ ...input, id, used_at: input.used_at ?? null });
    const [row] = await db.select().from(productStock).where(eq(productStock.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const updateProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productStockUpdateSchema.parse(req.body || {});
    await (db.update(productStock) as any).set(patch).where(eq(productStock.id, id));
    const rows = await db.select().from(productStock).where(eq(productStock.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(400).send({ error: { message: 'validation_error', details: e?.issues } });
  }
};

export const deleteProductStock: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productStock) as any).where(eq(productStock.id, id));
  return reply.code(204).send();
};
