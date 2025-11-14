// =============================================================
// FILE: src/modules/products/admin.controller.ts
// CORE PRODUCT + BULK + TOGGLES + STOCK + CATEGORIES
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, desc, eq, like, sql, asc, inArray, or } from "drizzle-orm";
import { products, productStock } from "./schema";
import { categories } from "@/modules/categories/schema";
import { productCreateSchema, productUpdateSchema } from "./validation";
/* storage */
import { storageAssets } from "@/modules/storage/schema";

const now = () => new Date();

// number helper
const toNumber = (x: any) =>
  x === null || x === undefined ? x : Number.isNaN(Number(x)) ? x : Number(x);

// bool helper
const toBool = (x: any) =>
  typeof x === "boolean" ? x : Number(x) === 1;

// JSON parse helper
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
  p.stock_quantity = toNumber(p.stock_quantity) ?? 0;

  // json
  p.gallery_urls = parseJson<string[]>(p.gallery_urls);
  p.gallery_asset_ids = parseJson<string[]>(p.gallery_asset_ids);
  p.features = parseJson<string[]>(p.features);
  p.custom_fields = parseJson(p.custom_fields);
  p.quantity_options = parseJson(p.quantity_options);
  p.badges = parseJson(p.badges);

  // booleans
  const b = (x: any) => (typeof x === "boolean" ? x : Number(x) === 1);
  p.is_active = b(p.is_active);
  p.is_featured = b(p.is_featured);
  p.requires_shipping = b(p.requires_shipping);
  p.article_enabled = b(p.article_enabled);
  p.demo_embed_enabled = b(p.demo_embed_enabled);
  if ("is_digital" in p) p.is_digital = b(p.is_digital);
  if ("auto_delivery_enabled" in p) p.auto_delivery_enabled = b(p.auto_delivery_enabled);
  if ("pre_order_enabled" in p) p.pre_order_enabled = b(p.pre_order_enabled);

  // FE alias
  p.show_on_homepage = "show_on_homepage" in p ? b(p.show_on_homepage) : b(p.is_featured);
  return p;
}

/* ============================ */
/* Storage hydrate yardımcıları */
/* ============================ */

type MinimalAsset = {
  id: string;
  provider_public_id: string | null;
  url: string; // non-null
};

type AssetRow = {
  id: string;
  provider_public_id: string | null;
  url: string | null;
};

async function fetchAssetsByAnyId(ids: string[]): Promise<Map<string, MinimalAsset>> {
  if (!ids?.length) return new Map();

  const keys = Array.from(new Set(ids.filter(Boolean))).slice(0, 500);
  if (!keys.length) return new Map();

  const rows: AssetRow[] = await db
    .select({
      id: storageAssets.id,
      provider_public_id: storageAssets.provider_public_id,
      url: storageAssets.url,
    })
    .from(storageAssets)
    .where(
      or(
        inArray(storageAssets.id, keys as string[]),
        inArray(storageAssets.provider_public_id, keys as string[])
      )
    );

  const map = new Map<string, MinimalAsset>();
  for (const r of rows) {
    if (!r.url) continue;
    const a: MinimalAsset = {
      id: r.id,
      provider_public_id: r.provider_public_id,
      url: r.url,
    };
    map.set(r.id, a);
    if (r.provider_public_id) map.set(r.provider_public_id, a);
  }

  return map;
}

async function hydrateAssetsFromStorage<T extends Record<string, any>>(obj: T) {
  const patch: Record<string, any> = {};

  const singleId = obj.featured_image_asset_id as string | undefined | null;
  const galleryIds = (obj.gallery_asset_ids as string[] | undefined | null) || [];

  const ids = [...(singleId ? [singleId] : []), ...galleryIds];
  if (!ids.length) return patch;

  const assetMap = await fetchAssetsByAnyId(ids);

  if (singleId) {
    const a = assetMap.get(singleId);
    if (a?.url) {
      patch.featured_image = a.url;
    }
  }

  if (galleryIds.length) {
    const urls = galleryIds
      .map((k) => assetMap.get(k)?.url)
      .filter((u): u is string => !!u);
    patch.gallery_urls = urls.length ? urls : null;
  }

  return patch;
}

/* ============================================= */
/* PRODUCTS (ADMIN – CORE CRUD)                  */
/* ============================================= */

export const adminListProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    q?: string;
    category_id?: string;
    is_active?: string | boolean;
    show_on_homepage?: string | boolean;
    min_price?: string;
    max_price?: string;
    limit?: string;
    offset?: string;
    sort?: "created_at" | "price" | "name" | "review_count" | "rating";
    order?: "asc" | "desc" | string;
  };

  const conds: any[] = [];
  if (q.q) conds.push(like(products.name, `%${q.q}%`));
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.is_active !== undefined) {
    const v =
      typeof q.is_active === "boolean"
        ? q.is_active
        : q.is_active === "1" || q.is_active === "true";
    conds.push(eq(products.is_active, (v ? 1 : 0) as any));
  }
  if (q.show_on_homepage !== undefined) {
    const v =
      typeof q.show_on_homepage === "boolean"
        ? q.show_on_homepage
        : q.show_on_homepage === "1" || q.show_on_homepage === "true";
    conds.push(eq(products.is_featured, (v ? 1 : 0) as any));
  }
  if (q.min_price) conds.push(sql`${products.price} >= ${q.min_price}`);
  if (q.max_price) conds.push(sql`${products.price} <= ${q.max_price}`);

  const whereExpr = conds.length ? and(...conds) : undefined;

  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  const colMap = {
    created_at: products.created_at,
    price: products.price,
    name: products.name,
    review_count: products.review_count,
    rating: products.rating,
  } as const;
  const sortKey = q.sort && colMap[q.sort] ? q.sort : "created_at";
  const dir: "asc" | "desc" = q.order === "asc" ? "asc" : "desc";
  const orderExpr =
    dir === "asc" ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  const baseSel = db.select().from(products);
  const dataQuery = (whereExpr ? baseSel.where(whereExpr) : baseSel)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  const rows = await dataQuery;
  return reply.send(rows.map(normalizeProduct));
};

export const adminGetProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(normalizeProduct(rows[0]));
};

export const adminCreateProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body ?? {});

    // FK guard (category)
    if (input.category_id) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.category_id))
        .limit(1);
      if (!cat)
        return reply
          .code(409)
          .send({
            error: {
              message: "category_not_found",
              details: input.category_id,
            },
          });
    }

    const hydrated = await hydrateAssetsFromStorage(input);

    const id = input.id ?? randomUUID();
    await (db.insert(products) as any).values({
      ...input,
      ...hydrated,
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
    const code = e?.cause?.code || e?.code;
    if (e?.name === "ZodError") {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    if (code === "ER_NO_REFERENCED_ROW_2" || code === 1452) {
      return reply
        .code(409)
        .send({ error: { message: "fk_category_not_found" } });
    }
    if (code === "ER_DUP_ENTRY" || code === 1062) {
      return reply
        .code(409)
        .send({ error: { message: "duplicate_slug" } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const adminUpdateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productUpdateSchema.parse(req.body ?? {});

    if (patch.category_id) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, patch.category_id))
        .limit(1);
      if (!cat)
        return reply
          .code(409)
          .send({
            error: {
              message: "category_not_found",
              details: patch.category_id,
            },
          });
    }

    const hydrated = await hydrateAssetsFromStorage(patch);

    await (db.update(products) as any)
      .set({ ...patch, ...hydrated, updated_at: now() })
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
    const code = e?.cause?.code || e?.code;
    if (e?.name === "ZodError") {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    if (code === "ER_NO_REFERENCED_ROW_2" || code === 1452) {
      return reply
        .code(409)
        .send({ error: { message: "fk_category_not_found" } });
    }
    if (code === "ER_DUP_ENTRY" || code === 1062) {
      return reply
        .code(409)
        .send({ error: { message: "duplicate_slug" } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const adminDeleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(products) as any).where(eq(products.id, id));
  return reply.code(204).send();
};

/* ============================================= */
/* BULK + TOGGLES                                */
/* ============================================= */

export const adminBulkSetActive: RouteHandler = async (req, reply) => {
  const body = (req.body || {}) as { ids?: string[]; is_active?: boolean };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return reply.code(400).send({ error: { message: "ids_required" } });
  }
  const v = body.is_active ? 1 : 0;
  await (db.update(products) as any)
    .set({ is_active: v as any, updated_at: now() })
    .where(inArray(products.id, body.ids));
  return reply.send({ ok: true as const });
};

// Şimdilik stub (istenirse kategori içi reorder ekleriz)
export const adminReorderProducts: RouteHandler = async (_req, reply) => {
  return reply.send({ ok: true as const });
};

export const adminToggleActive: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { is_active } = (req.body || {}) as { is_active: boolean };
  await (db.update(products) as any)
    .set({ is_active: is_active ? 1 : 0, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return reply.send(normalizeProduct(row));
};

export const adminToggleHomepage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { show_on_homepage } = (req.body || {}) as {
    show_on_homepage: boolean;
  };
  await (db.update(products) as any)
    .set({ is_featured: show_on_homepage ? 1 : 0, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return reply.send(normalizeProduct(row));
};

/* ============================================= */
/* STOCK                                         */
/* ============================================= */

export const adminSetProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { lines } = (req.body || {}) as { lines?: string[] };
  const items = Array.isArray(lines)
    ? lines.map((s) => String(s).trim()).filter(Boolean)
    : [];

  // önce kullanılmamış stokları sil
  await (db.delete(productStock) as any).where(
    and(eq(productStock.product_id, id), eq(productStock.is_used, 0 as any))
  );

  // ekle
  if (items.length) {
    await (db.insert(productStock) as any).values(
      items.map((line) => ({
        id: randomUUID(),
        product_id: id,
        stock_content: line,
        is_used: 0,
        used_at: null,
        created_at: now(),
        order_item_id: null,
      }))
    );
  }

  // yeniden say ve products.stock_quantity güncelle
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(productStock)
    .where(
      and(eq(productStock.product_id, id), eq(productStock.is_used, 0 as any))
    );

  await (db.update(products) as any)
    .set({ stock_quantity: Number(cnt || 0) as any, updated_at: now() })
    .where(eq(products.id, id));

  return reply.send({ updated_stock_quantity: Number(cnt || 0) });
};

export const adminListUsedStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select()
    .from(productStock)
    .where(
      and(eq(productStock.product_id, id), eq(productStock.is_used, 1 as any))
    )
    .orderBy(desc(productStock.used_at));

  const out = rows.map((r: any) => ({
    id: r.id,
    product_id: r.product_id,
    stock_content: r.stock_content,
    is_used: !!toBool(r.is_used),
    used_at: r.used_at,
    created_at: r.created_at,
    order_item_id: r.order_item_id,
    order: null,
  }));

  return reply.send(out);
};

/* ============================================= */
/* CATEGORIES LIST                               */
/* ============================================= */

export const adminListCategories: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      parent_id: categories.parent_id,
      is_featured: categories.is_featured,
    })
    .from(categories)
    .orderBy(asc(categories.name));
  return reply.send(rows);
};
