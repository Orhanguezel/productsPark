// =============================================================
// FILE: src/modules/products/admin.controller.ts
// FINAL — Products (DDL + schema/validation ile tam uyumlu)
// - JSON alanlar "yutulmaz" (loose parse + empty => null)
// - Storage hydrate + image_url <-> featured_image mirror korunur
// - IMPORTANT: sales_count = elle girilen satış sayısı (admin create/update raw inject)
// - review_count = yorum sayısı (admin payload ile değiştirilmiyor; istenirse ayrı endpoint ile yönetilir)
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';

import { products, productStock } from './schema';
import { categories } from '@/modules/categories/schema';
import { productCreateSchema, productUpdateSchema } from './validation';

/* storage */
import { storageAssets } from '@/modules/storage/schema';
import { now, toBool, toNumber } from '@/modules/_shared/common';

/* ========================= */
/* JSON helpers (kritik fix) */
/* ========================= */

function parseJsonLoose<T = unknown>(v: unknown): T | null {
  if (v === null || v === undefined) return null;

  // MySQL JSON bazen zaten object/array döner
  if (typeof v === 'object') return v as T;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  return null;
}

/** Boş array/object => null (DB’de JSON null tutmak için) */
function nullIfEmptyJson(v: unknown): unknown {
  if (v === undefined) return undefined;
  if (v === null) return null;

  const obj = parseJsonLoose<unknown>(v) ?? v;

  if (Array.isArray(obj)) return obj.length ? obj : null;
  if (typeof obj === 'object' && obj) return Object.keys(obj as any).length ? obj : null;
  return obj;
}

function normalizeQuantityOptions(v: unknown): any[] | null | undefined {
  if (v === undefined) return undefined;

  const arr = parseJsonLoose<any[]>(v);
  if (!arr) return null;

  // FE bazen quantity=0 satır ekliyor -> DB’ye yazma
  const out = arr
    .map((x) => ({
      quantity: Number((x as any)?.quantity ?? 0) || 0,
      price: Number((x as any)?.price ?? 0) || 0,
    }))
    .filter((x) => x.quantity >= 1);

  return out.length ? out : null;
}

function normalizeBadges(v: unknown): any[] | null | undefined {
  if (v === undefined) return undefined;

  const arr = parseJsonLoose<any[]>(v);
  if (!arr) return null;

  const out = arr
    .map((b) => ({
      text: String((b as any)?.text ?? '').trim(),
      icon:
        (b as any)?.icon == null ? null : String((b as any)?.icon ?? '').trim() || null,
      active: !!(b as any)?.active,
    }))
    .filter((b) => b.text.length > 0);

  return out.length ? out : null;
}

function normalizeCustomFields(v: unknown): any[] | null | undefined {
  if (v === undefined) return undefined;

  const arr = parseJsonLoose<any[]>(v);
  if (!arr) return null;

  const out = arr
    .map((f) => ({
      id: String((f as any)?.id ?? '').trim(),
      label: String((f as any)?.label ?? '').trim(),
      type: String((f as any)?.type ?? 'text'),
      placeholder:
        (f as any)?.placeholder == null ? null : String((f as any)?.placeholder ?? '') || null,
      required: !!(f as any)?.required,
    }))
    .filter((f) => f.id && f.label);

  return out.length ? out : null;
}

/* ============================ */
/* Storage hydrate yardımcıları */
/* ============================ */

type MinimalAsset = { id: string; provider_public_id: string | null; url: string };
type AssetRow = { id: string; provider_public_id: string | null; url: string | null };

async function fetchAssetsByAnyId(ids: string[]): Promise<Map<string, MinimalAsset>> {
  const keys = Array.from(new Set((ids ?? []).filter(Boolean))).slice(0, 500);
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
        inArray(storageAssets.provider_public_id, keys as string[]),
      ),
    );

  const map = new Map<string, MinimalAsset>();
  for (const r of rows) {
    if (!r.url) continue;
    const a: MinimalAsset = { id: r.id, provider_public_id: r.provider_public_id, url: r.url };
    map.set(r.id, a);
    if (r.provider_public_id) map.set(r.provider_public_id, a);
  }
  return map;
}

async function hydrateAssetsFromStorage(obj: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};

  const singleId = obj.featured_image_asset_id as string | null | undefined;
  const galleryIds = (obj.gallery_asset_ids as string[] | null | undefined) ?? [];

  const ids = [...(singleId ? [singleId] : []), ...galleryIds];
  if (!ids.length) return patch;

  const assetMap = await fetchAssetsByAnyId(ids);

  if (singleId) {
    const a = assetMap.get(singleId);
    if (a?.url) patch.featured_image = a.url;
  }

  if (galleryIds.length) {
    const urls = galleryIds.map((k) => assetMap.get(k)?.url).filter((u): u is string => !!u);
    patch.gallery_urls = urls.length ? urls : null;
  }

  return patch;
}

/* ===================================================== */
/* Helper: image_url <-> featured_image mirror            */
/* ===================================================== */
function applyImageMirror(patch: Record<string, unknown>, hydrated?: Record<string, unknown>) {
  const p: Record<string, unknown> = { ...patch };

  const hydratedFeatured =
    hydrated && typeof hydrated.featured_image === 'string' && hydrated.featured_image.trim()
      ? hydrated.featured_image.trim()
      : undefined;

  const patchFeatured =
    typeof p.featured_image === 'string' && p.featured_image.trim()
      ? p.featured_image.trim()
      : p.featured_image === null
        ? null
        : undefined;

  const patchImageUrl =
    typeof p.image_url === 'string' && p.image_url.trim()
      ? p.image_url.trim()
      : p.image_url === null
        ? null
        : undefined;

  if (hydratedFeatured) {
    p.featured_image = hydratedFeatured;
    if (patchImageUrl === undefined) p.image_url = hydratedFeatured;
    return p;
  }

  if (patchFeatured !== undefined && patchImageUrl === undefined) {
    p.image_url = patchFeatured;
    return p;
  }

  if (patchImageUrl !== undefined && patchFeatured === undefined) {
    p.featured_image = patchImageUrl;
    return p;
  }

  return p;
}

/* ============================================= */
/* Helper: JSON alanları DB’ye yazmadan normalize */
/* ============================================= */
function normalizeJsonPatch(input: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...input };

  out.gallery_urls = nullIfEmptyJson(out.gallery_urls);
  out.gallery_asset_ids = nullIfEmptyJson(out.gallery_asset_ids);

  // features db’de json(record|array) ama FE string[] gönderiyor -> loose tut
  out.features = nullIfEmptyJson(out.features);

  out.badges = normalizeBadges(out.badges);
  out.custom_fields = normalizeCustomFields(out.custom_fields);
  out.quantity_options = normalizeQuantityOptions(out.quantity_options);

  return out;
}

/* ======================== */
/* response normalize       */
/* ======================== */
function normalizeProduct(row: any) {
  if (!row) return row;
  const p = { ...row };

  p.price = toNumber(p.price);
  p.original_price = toNumber(p.original_price);
  p.cost = toNumber(p.cost);

  p.rating = toNumber(p.rating);
  p.review_count = toNumber(p.review_count) ?? 0; // yorum sayısı
  p.sales_count = toNumber(p.sales_count) ?? 0; // satış sayısı (manuel)

  p.stock_quantity = toNumber(p.stock_quantity) ?? 0;

  p.gallery_urls = parseJsonLoose<string[]>(p.gallery_urls);
  p.gallery_asset_ids = parseJsonLoose<string[]>(p.gallery_asset_ids);
  p.features = parseJsonLoose<any>(p.features);

  p.custom_fields = parseJsonLoose<any[]>(p.custom_fields);
  p.quantity_options = parseJsonLoose<any[]>(p.quantity_options);
  p.badges = parseJsonLoose<any[]>(p.badges);

  p.is_active = toBool(p.is_active);
  p.is_featured = toBool(p.is_featured);
  p.requires_shipping = toBool(p.requires_shipping);
  p.article_enabled = toBool(p.article_enabled);
  p.demo_embed_enabled = toBool(p.demo_embed_enabled);
  if ('is_digital' in p) p.is_digital = toBool(p.is_digital);
  if ('auto_delivery_enabled' in p) p.auto_delivery_enabled = toBool(p.auto_delivery_enabled);
  if ('pre_order_enabled' in p) p.pre_order_enabled = toBool(p.pre_order_enabled);

  // FE alias
  p.show_on_homepage = toBool(p.is_featured);

  return p;
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
    sort?: 'created_at' | 'price' | 'name' | 'review_count' | 'rating' | 'sales_count';
    order?: 'asc' | 'desc' | string;
  };

  const conds: any[] = [];
  if (q.q) conds.push(like(products.name, `%${q.q}%`));
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));

  if (q.is_active !== undefined) {
    const v =
      typeof q.is_active === 'boolean' ? q.is_active : q.is_active === '1' || q.is_active === 'true';
    conds.push(eq(products.is_active, (v ? 1 : 0) as any));
  }

  if (q.show_on_homepage !== undefined) {
    const v =
      typeof q.show_on_homepage === 'boolean'
        ? q.show_on_homepage
        : q.show_on_homepage === '1' || q.show_on_homepage === 'true';
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
    sales_count: products.sales_count,
  } as const;

  const sortKey = q.sort && colMap[q.sort] ? q.sort : 'created_at';
  const dir: 'asc' | 'desc' = q.order === 'asc' ? 'asc' : 'desc';
  const orderExpr = dir === 'asc' ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  // count headers (admin tabloları için faydalı)
  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(products);
  const [{ total }] = await (whereExpr ? countBase.where(whereExpr) : countBase);

  const baseSel = db.select().from(products);
  const rows = await (whereExpr ? baseSel.where(whereExpr) : baseSel)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  reply.header('x-total-count', String(Number(total || 0)));
  reply.header('content-range', `*/${Number(total || 0)}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(rows.map(normalizeProduct));
};

export const adminGetProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(normalizeProduct(rows[0]));
};

/* ========================================================= */
/* CREATE                                                     */
/* ========================================================= */
export const adminCreateProduct: RouteHandler = async (req, reply) => {
  try {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const input = productCreateSchema.parse(raw);

    // ✅ sales_count ham body'den inject (UI burada elle giriyor)
    const scRaw = raw.sales_count;
    const salesCount =
      scRaw === undefined || scRaw === null || scRaw === '' ? 0 : Number(scRaw) || 0;

    // FK guard (category)
    if (input.category_id) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.category_id))
        .limit(1);

      if (!cat) {
        return reply.code(409).send({
          error: { message: 'category_not_found', details: input.category_id },
        });
      }
    }

    // JSON normalize
    const normalizedInput = normalizeJsonPatch({ ...input });

    const hydrated = await hydrateAssetsFromStorage(normalizedInput);

    // image mirror
    const mergedForInsert = applyImageMirror(normalizedInput, hydrated);

    const id = input.id ?? randomUUID();

    await (db.insert(products) as any).values({
      ...mergedForInsert,
      sales_count: salesCount,
      ...hydrated,
      id,
      created_at: now(),
      updated_at: now(),
    });

    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return reply.code(201).send(normalizeProduct(row));
  } catch (e: any) {
    const code = e?.cause?.code || e?.code;
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 1452) {
      return reply.code(409).send({ error: { message: 'fk_category_not_found' } });
    }
    if (code === 'ER_DUP_ENTRY' || code === 1062) {
      return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/* ========================================================= */
/* UPDATE                                                     */
/* ========================================================= */
export const adminUpdateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const raw = (req.body ?? {}) as Record<string, unknown>;
    const parsed = productUpdateSchema.parse(raw);

    // ✅ review_count’u admin patch’ten sök (yorum sayısı admin edit ile değişmesin)
    // ✅ sales_count admin UI'dan yönetilir
    // Not: Zod parse sonrası alanlar typed, ama biz güvenli destructure yapıyoruz.
    const { review_count: _ignoredReviewCount, sales_count: _salesFromParsed, ...patchRaw0 } =
      parsed as any;

    // kategori FK kontrolü
    if (patchRaw0.category_id) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, patchRaw0.category_id))
        .limit(1);

      if (!cat) {
        return reply.code(409).send({
          error: { message: 'category_not_found', details: patchRaw0.category_id },
        });
      }
    }

    // ✅ ham body'den sales_count (opsiyonel)
    let salesPatch: number | undefined;
    if (Object.prototype.hasOwnProperty.call(raw, 'sales_count')) {
      const val = raw.sales_count;
      if (val === null || val === '') {
        salesPatch = 0;
      } else {
        const n = Number(val);
        if (!Number.isNaN(n)) salesPatch = n;
      }
    }

    // JSON normalize
    const patchRaw = normalizeJsonPatch({ ...patchRaw0 });

    const hydrated = await hydrateAssetsFromStorage(patchRaw);

    const patch = applyImageMirror(patchRaw, hydrated);

    await (db.update(products) as any)
      .set({
        ...patch,
        ...(salesPatch !== undefined ? { sales_count: salesPatch } : {}),
        ...hydrated,
        updated_at: now(),
      })
      .where(eq(products.id, id));

    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(normalizeProduct(rows[0]));
  } catch (e: any) {
    const code = e?.cause?.code || e?.code;
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 1452) {
      return reply.code(409).send({ error: { message: 'fk_category_not_found' } });
    }
    if (code === 'ER_DUP_ENTRY' || code === 1062) {
      return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
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
    return reply.code(400).send({ error: { message: 'ids_required' } });
  }
  const v = body.is_active ? 1 : 0;
  await (db.update(products) as any)
    .set({ is_active: v as any, updated_at: now() })
    .where(inArray(products.id, body.ids));
  return reply.send({ ok: true as const });
};

export const adminReorderProducts: RouteHandler = async (_req, reply) => {
  return reply.send({ ok: true as const });
};

export const adminToggleActive: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { is_active } = (req.body || {}) as { is_active: boolean };
  await (db.update(products) as any)
    .set({ is_active: is_active ? 1 : 0, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.send(normalizeProduct(row));
};

export const adminToggleHomepage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { show_on_homepage } = (req.body || {}) as { show_on_homepage: boolean };
  await (db.update(products) as any)
    .set({ is_featured: show_on_homepage ? 1 : 0, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.send(normalizeProduct(row));
};
