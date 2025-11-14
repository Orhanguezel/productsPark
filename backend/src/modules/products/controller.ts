// =============================================================
// FILE: src/modules/products/controller.ts
// (Public endpoints)
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, desc, eq, like, sql, asc } from "drizzle-orm";
import {
  products,
  productFaqs,
  productOptions,
  productReviews,
  productStock,
} from "./schema";
import { categories } from "@/modules/categories/schema";
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
} from "./validation";
import { ZodError } from "zod";

const now = () => new Date();
const toNumber = (x: any) =>
  x === null || x === undefined ? x : (Number.isNaN(Number(x)) ? x : Number(x));
const toBool = (x: any) => (typeof x === "boolean" ? x : Number(x) === 1);

const parseJson = <T,>(val: any): T | null => {
  if (val == null) return null;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
  if (typeof val === "object") return val as T;
  return null;
};

function normalizeProduct(row: any) {
  if (!row) return row;
  const p = { ...row };

  // numbers
  p.price = toNumber(p.price);
  p.original_price = toNumber(p.original_price);
  p.cost = toNumber(p.cost);
  p.rating = toNumber(p.rating);
  p.review_count = toNumber(p.review_count) ?? 0;

  // json
  p.gallery_urls = parseJson<string[]>(p.gallery_urls);
  p.gallery_asset_ids = parseJson<string[]>(p.gallery_asset_ids); // 🔧 new
  p.features = parseJson<string[]>(p.features);
  p.custom_fields = parseJson(p.custom_fields);
  p.quantity_options = parseJson(p.quantity_options);
  p.badges = parseJson(p.badges);

  // booleans (tinyint)
  p.is_active = toBool(p.is_active);
  p.is_featured = toBool(p.is_featured);
  p.requires_shipping = toBool(p.requires_shipping);
  p.article_enabled = toBool(p.article_enabled);
  p.demo_embed_enabled = toBool(p.demo_embed_enabled);

  // FE wants this alias if column absent → map to is_featured
  p.show_on_homepage =
    "show_on_homepage" in p
      ? toBool(p.show_on_homepage)
      : toBool(p.is_featured);

  // strict numbers
  p.stock_quantity = toNumber(p.stock_quantity) ?? 0;

  return p;
}

/** GET /products?category_id=&is_active=&q=&limit=&offset=&sort=(price|rating|created_at)&order=(asc|desc|created_at.desc)&slug= */
export const listProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    category_id?: string;
    is_active?: string;
    q?: string;
    limit?: string;
    offset?: string;
    sort?: "price" | "rating" | "created_at";
    order?: "asc" | "desc" | string;
    slug?: string;
    min_price?: string;
    max_price?: string;
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

    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    const r = rows[0];
    return reply.send({ ...normalizeProduct(r.p), categories: r.c });
  }

  // filters
  const conds: any[] = [];
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.is_active !== undefined) {
    const v = q.is_active === "1" || q.is_active === "true" ? 1 : 0;
    conds.push(eq(products.is_active, v as any));
  }
  if (q.q) conds.push(like(products.name, `%${q.q}%`));
  if (q.min_price) conds.push(sql`${products.price} >= ${q.min_price}`);
  if (q.max_price) conds.push(sql`${products.price} <= ${q.max_price}`);

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

  let sortKey: keyof typeof colMap = "created_at";
  let dir: "asc" | "desc" = "desc";

  if (q.sort) {
    sortKey = q.sort;
    dir = q.order === "asc" ? "asc" : "desc";
  } else if (q.order && q.order.includes(".")) {
    const [col, d] = String(q.order).split(".");
    sortKey = (["price", "rating", "created_at"] as const).includes(
      col as any
    )
      ? (col as keyof typeof colMap)
      : "created_at";
    dir = d?.toLowerCase() === "asc" ? "asc" : "desc";
  }
  const orderExpr =
    dir === "asc" ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

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

  const dataQuery = (whereExpr ? dataBase.where(whereExpr) : dataBase)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  const rows = await dataQuery;
  const out = rows.map((r) => ({ ...normalizeProduct(r.p), categories: r.c }));

  reply.header("x-total-count", String(Number(total || 0)));
  reply.header("content-range", `*/${Number(total || 0)}`);
  reply.header(
    "access-control-expose-headers",
    "x-total-count, content-range"
  );

  return reply.send(out);
};

// UUID or slug
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), categories: r.c });
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

  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), categories: r.c });
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

  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), categories: r.c });
};

/** POST /products  (kullanmak istemezsen route'a bağlama) */
export const createProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body ?? {});
    const id = input.id ?? randomUUID();

    await (db.insert(products) as any).values({
      ...input,
      id,
      created_at: now(),
      updated_at: now(),
    });

    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return reply.code(201).send(normalizeProduct(row));
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    if (e?.code === "ER_NO_REFERENCED_ROW_2") {
      return reply.code(409).send({
        error: {
          message: "fk_category_not_found",
          details: e.sqlMessage,
        },
      });
    }
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({
        error: {
          message: "duplicate_slug",
          details: e.sqlMessage,
        },
      });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

/** PATCH /products/:id */
export const updateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productUpdateSchema.parse(req.body || {});
    await (db.update(products) as any)
      .set({ ...patch, updated_at: now() })
      .where(eq(products.id, id));

    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(normalizeProduct(rows[0]));
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({
        error: {
          message: "duplicate_slug",
          details: e.sqlMessage,
        },
      });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
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
  const q = (req.query || {}) as {
    product_id?: string;
    only_active?: string;
  };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productFaqs.product_id, q.product_id));
  if (q.only_active === "1" || q.only_active === "true")
    conds.push(eq(productFaqs.is_active, 1 as any));
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productFaqs);
  const rows = await (whereExpr
    ? base.where(whereExpr as any)
    : base
  ).orderBy(productFaqs.display_order);
  return reply.send(rows);
};

export const createProductFaq: RouteHandler = async (req, reply) => {
  try {
    const input = productFaqCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productFaqs) as any).values({
      ...input,
      id,
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db
      .select()
      .from(productFaqs)
      .where(eq(productFaqs.id, id))
      .limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const updateProductFaq: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productFaqUpdateSchema.parse(req.body || {});
    await (db.update(productFaqs) as any)
      .set({ ...patch, updated_at: now() })
      .where(eq(productFaqs.id, id));
    const rows = await db
      .select()
      .from(productFaqs)
      .where(eq(productFaqs.id, id))
      .limit(1);
    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const deleteProductFaq: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
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
      ...input,
      id,
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.id, id))
      .limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const updateProductOption: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productOptionUpdateSchema.parse(req.body || {});
    await (db.update(productOptions) as any)
      .set({ ...patch, updated_at: now() })
      .where(eq(productOptions.id, id));
    const rows = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.id, id))
      .limit(1);
    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const deleteProductOption: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productOptions) as any).where(eq(productOptions.id, id));
  return reply.code(204).send();
};

export const listProductReviews: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    product_id?: string;
    only_active?: string;
  };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productReviews.product_id, q.product_id));
  if (q.only_active === "1" || q.only_active === "true")
    conds.push(eq(productReviews.is_active, 1 as any));
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productReviews);
  const rows = await (whereExpr
    ? base.where(whereExpr as any)
    : base
  ).orderBy(desc(productReviews.review_date));
  return reply.send(rows);
};

export const createProductReview: RouteHandler = async (req, reply) => {
  try {
    const input = productReviewCreateSchema.parse(req.body || {});
    const id = input.id ?? randomUUID();
    await (db.insert(productReviews) as any).values({
      ...input,
      id,
      review_date: input.review_date ?? now(),
      created_at: now(),
      updated_at: now(),
    });
    const [row] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const updateProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productReviewUpdateSchema.parse(req.body || {});
    await (db.update(productReviews) as any)
      .set({ ...patch, updated_at: now() })
      .where(eq(productReviews.id, id));
    const rows = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1);
    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const deleteProductReview: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productReviews) as any).where(eq(productReviews.id, id));
  return reply.code(204).send();
};

export const listProductStock: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    product_id?: string;
    is_used?: string;
  };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productStock.product_id, q.product_id));
  if (q.is_used !== undefined) {
    const v = q.is_used === "1" || q.is_used === "true" ? 1 : 0;
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
      ...input,
      id,
      used_at: input.used_at ?? null,
      created_at: now(),
    });
    const [row] = await db
      .select()
      .from(productStock)
      .where(eq(productStock.id, id))
      .limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const updateProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productStockUpdateSchema.parse(req.body || {});
    await (db.update(productStock) as any)
      .set(patch)
      .where(eq(productStock.id, id));
    const rows = await db
      .select()
      .from(productStock)
      .where(eq(productStock.id, id))
      .limit(1);
    if (!rows.length)
      return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(rows[0]);
  } catch (e: any) {
    if (e instanceof ZodError) {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const deleteProductStock: RouteHandler = async (_req, reply) => {
  const { id } = _req.params as { id: string };
  await (db.delete(productStock) as any).where(eq(productStock.id, id));
  return reply.code(204).send();
};
