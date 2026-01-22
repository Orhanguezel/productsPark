// =============================================================
// STOCK (ADMIN) — FINAL (FE RTK ile birebir uyumlu)
// Routes:
// - GET    /admin/products/:id/stock?is_used=0&limit=&offset=&q=
// - PUT    /admin/products/:id/stock   body: { lines: string[] }
// - DELETE /admin/products/:id/stock/:stockId
// - GET    /admin/products/:id/stock/used
// =============================================================

import type { RouteHandler } from 'fastify';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { products, productStock } from './schema';
import { now, toBool } from '@/modules/_shared/common';

/** query parse helpers */
const toInt = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toIsUsed = (v: unknown): 0 | 1 | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === 0 || v === 1) return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === 'false') return 0;
    if (s === '1' || s === 'true') return 1;
  }
  return undefined;
};

/** FE Stock normalizer bekliyor: id, product_id, code, stock_content?, is_used, used_at?, created_at?, order_item_id? */
const mapStockRow = (r: any) => {
  const stockContent = String(r.stock_content ?? '').trim();
  return {
    id: String(r.id ?? ''),
    product_id: String(r.product_id ?? ''),
    code: stockContent, // FE alias
    stock_content: stockContent,
    is_used: !!toBool(r.is_used),
    used_at: r.used_at ?? null,
    created_at: r.created_at ?? undefined,
    order_item_id: r.order_item_id ?? null,
  };
};

/** stock_quantity = unused count */
async function syncProductStockQuantity(productId: string) {
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(productStock)
    .where(and(eq(productStock.product_id, productId), eq(productStock.is_used, 0 as any)));

  const qty = Number(cnt || 0);

  await (db.update(products) as any)
    .set({ stock_quantity: qty as any, updated_at: now() })
    .where(eq(products.id, productId));

  return qty;
}

/**
 * GET /admin/products/:id/stock
 * FE: useListProductStockAdminQuery({ id, params: { is_used: 0 } })
 */
export const adminListProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as {
    is_used?: unknown;
    limit?: unknown;
    offset?: unknown;
    q?: unknown;
  };

  const isUsed = toIsUsed(q.is_used);
  const limit = Math.min(Math.max(toInt(q.limit, 200), 1), 500);
  const offset = Math.max(toInt(q.offset, 0), 0);
  const search = typeof q.q === 'string' ? q.q.trim() : '';

  const conds: any[] = [eq(productStock.product_id, id)];
  if (typeof isUsed !== 'undefined') conds.push(eq(productStock.is_used, isUsed as any));
  if (search) conds.push(like(productStock.stock_content, `%${search}%`));

  const rows = await db
    .select()
    .from(productStock)
    .where(and(...conds))
    .orderBy(desc(productStock.created_at))
    .limit(limit)
    .offset(offset);

  // FE normalizer array veya {data:[]} kabul ediyor, direkt array dönmek en temiz
  return reply.send(rows.map(mapStockRow));
};

/**
 * PUT /admin/products/:id/stock
 * body: { lines: string[] }
 * - sadece "unused" (is_used=0) stoklarını replace eder
 */
export const adminSetProductStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  // ✅ body yoksa bile kırılmasın
  const body = (req.body || {}) as { lines?: unknown };
  const lines = Array.isArray(body.lines) ? body.lines : [];

  const items = lines.map((s) => String(s).trim()).filter(Boolean);

  // önce unused satırları sil
  await (db.delete(productStock) as any).where(
    and(eq(productStock.product_id, id), eq(productStock.is_used, 0 as any)),
  );

  // sonra yeni unused satırları ekle
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
      })),
    );
  }

  const updated = await syncProductStockQuantity(id);
  return reply.send({ updated_stock_quantity: updated });
};

/**
 * DELETE /admin/products/:id/stock/:stockId
 * - tek satır siler
 * - stock_quantity’yi yeniden senkron eder
 */
export const adminDeleteProductStockLine: RouteHandler = async (req, reply) => {
  const { id, stockId } = req.params as { id: string; stockId: string };

  await (db.delete(productStock) as any).where(
    and(eq(productStock.product_id, id), eq(productStock.id, stockId)),
  );

  const updated = await syncProductStockQuantity(id);
  return reply.send({ ok: true as const, updated_stock_quantity: updated });
};

/**
 * GET /admin/products/:id/stock/used
 * FE: listUsedStockAdmin({ id, limit?, offset? })
 */
export const adminListUsedStock: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as { limit?: unknown; offset?: unknown };

  const limit = Math.min(Math.max(toInt(q.limit, 200), 1), 500);
  const offset = Math.max(toInt(q.offset, 0), 0);

  const rows = await db
    .select()
    .from(productStock)
    .where(and(eq(productStock.product_id, id), eq(productStock.is_used, 1 as any)))
    .orderBy(desc(productStock.used_at))
    .limit(limit)
    .offset(offset);

  // normalizeUsedStockItems hem array hem {data} okuyabiliyor; array dönelim
  const out = rows.map((r: any) => ({
    id: String(r.id ?? ''),
    product_id: String(r.product_id ?? ''),
    stock_content: String(r.stock_content ?? ''),
    is_used: !!toBool(r.is_used),
    used_at: r.used_at ?? null,
    created_at: r.created_at ?? '',
    order_item_id: r.order_item_id ?? null,
    order: null, // ileride order join yapılırsa doldurursun
  }));

  return reply.send(out);
};
