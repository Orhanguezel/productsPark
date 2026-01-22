// ===================================================================
// FILE: src/integrations/types/product_stock.ts
// FIXED — Product Stock types + normalizers + query/body mappers
// - fixes UsedStockItem typing (was Record<string,unknown> elsewhere)
// - removes invalid UsedStockItem['order'] usage
// - strict friendly
// ===================================================================

import type { BoolLike, QueryParams } from '@/integrations/types';
import { isObject, toStr, toBool } from '@/integrations/types';

/* ----------------------------- helpers ----------------------------- */

const trimStr = (v: unknown): string => toStr(v).trim();

const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v;
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
  }

  return undefined;
};

const pickFirst = (src: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

const pickArray = (res: unknown, keys: readonly string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of keys) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
};

const pickTrimStr = (
  src: Record<string, unknown>,
  keys: readonly string[],
  fallback = '',
): string => {
  const s = trimStr(pickFirst(src, keys));
  return s ? s : fallback;
};

const pickOptTrimStr = (src: Record<string, unknown>, keys: readonly string[]): string | null => {
  const s = trimStr(pickFirst(src, keys));
  return s ? s : null;
};

const pickBool = (
  src: Record<string, unknown>,
  keys: readonly string[],
  fallback = false,
): boolean => {
  const v = pickFirst(src, keys);
  return toBool(asBoolLike(v), fallback);
};

/* ----------------------------- domain types ----------------------------- */

export type Stock = {
  id: string;
  product_id: string;

  /** FE alias: stok kodu (stock_content fallback) */
  code: string;

  /** BE kolon adı (legacy) */
  stock_content?: string;

  is_used: boolean;
  used_at?: string | null;

  created_at?: string;
  order_item_id?: string | null;
};

export type UsedStockOrderBrief = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
};

export type UsedStockItem = {
  id: string;
  product_id: string;

  stock_content: string;
  is_used: boolean;

  used_at: string | null;
  created_at: string;

  order_item_id?: string | null;
  order?: UsedStockOrderBrief | null;
};

export type ApiStock = Partial<{
  id: unknown;

  product_id: unknown;
  productId: unknown;

  code: unknown;
  stock_content: unknown;
  stockContent: unknown;

  is_used: unknown;
  isUsed: unknown;

  used_at: unknown;
  usedAt: unknown;

  created_at: unknown;
  createdAt: unknown;

  order_item_id: unknown;
  orderItemId: unknown;
}>;

/** Public list params */
export type ProductStockListParams = {
  product_id?: string;
  is_used?: BoolLike;
};

/** Admin list params */
export type ProductStockAdminListParams = {
  product_id?: string;
  is_used?: BoolLike;
  limit?: number;
  offset?: number;
  q?: string;
};

/** Admin set/replace body */
export type ProductStockSetBody = {
  lines: string[];
};

/** Admin delete body (optional single line delete) */
export type ProductStockDeleteBody = {
  id?: string;
  code?: string;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeStock(row: unknown): Stock {
  const r: Record<string, unknown> = isObject(row) ? (row as Record<string, unknown>) : {};

  const id = pickTrimStr(r, ['id'], '');
  const product_id = pickTrimStr(r, ['product_id', 'productId'], '');

  const codeRaw =
    pickTrimStr(r, ['code'], '') || pickTrimStr(r, ['stock_content', 'stockContent'], '');

  const is_used = pickBool(r, ['is_used', 'isUsed'], false);

  const used_at_raw = pickOptTrimStr(r, ['used_at', 'usedAt']);
  const created_at_raw = pickOptTrimStr(r, ['created_at', 'createdAt']);
  const order_item_id_raw = pickOptTrimStr(r, ['order_item_id', 'orderItemId']);

  return {
    id,
    product_id,
    code: codeRaw,
    ...(codeRaw ? { stock_content: codeRaw } : {}),
    is_used,
    used_at: used_at_raw ? used_at_raw : null,
    ...(created_at_raw ? { created_at: created_at_raw } : {}),
    order_item_id: order_item_id_raw ? order_item_id_raw : null,
  };
}

export function normalizeStocks(res: unknown): Stock[] {
  const rows = pickArray(res, ['data', 'items', 'rows', 'stock', 'result']);
  return rows.map((x) => normalizeStock(x));
}

export function normalizeUsedStockItem(row: unknown): UsedStockItem {
  const r: Record<string, unknown> = isObject(row) ? (row as Record<string, unknown>) : {};

  const id = pickTrimStr(r, ['id'], '');
  const product_id = pickTrimStr(r, ['product_id', 'productId'], '');
  const stock_content = pickTrimStr(r, ['stock_content', 'stockContent', 'code'], '');

  const is_used = pickBool(r, ['is_used', 'isUsed'], false);

  const used_at = pickOptTrimStr(r, ['used_at', 'usedAt']);
  const created_at = pickTrimStr(r, ['created_at', 'createdAt'], '');

  const order_item_id = pickOptTrimStr(r, ['order_item_id', 'orderItemId']);

  const orderRaw = pickFirst(r, ['order']);
  const order: UsedStockOrderBrief | null = isObject(orderRaw)
    ? {
        id: pickTrimStr(orderRaw as Record<string, unknown>, ['id'], ''),
        order_number: pickTrimStr(
          orderRaw as Record<string, unknown>,
          ['order_number', 'orderNumber'],
          '',
        ),
        customer_name: pickTrimStr(
          orderRaw as Record<string, unknown>,
          ['customer_name', 'customerName'],
          '',
        ),
        ...(typeof pickFirst(orderRaw as Record<string, unknown>, [
          'customer_email',
          'customerEmail',
        ]) !== 'undefined'
          ? {
              customer_email: pickOptTrimStr(orderRaw as Record<string, unknown>, [
                'customer_email',
                'customerEmail',
              ]),
            }
          : {}),
      }
    : null;

  return {
    id,
    product_id,
    stock_content,
    is_used,
    used_at: used_at ?? null,
    created_at,
    order_item_id: order_item_id ?? null,
    order,
  };
}

export function normalizeUsedStockItems(res: unknown): UsedStockItem[] {
  const rows = pickArray(res, ['data', 'items', 'rows', 'stock', 'used', 'result']);
  return rows.map((x) => normalizeUsedStockItem(x));
}

/* ----------------------------- mappers ----------------------------- */

export function toPublicProductStockQuery(
  params?: ProductStockListParams | void,
): QueryParams | undefined {
  if (!params) return undefined;

  const out: QueryParams = {};
  if (params.product_id) out.product_id = params.product_id;
  if (typeof params.is_used !== 'undefined') out.is_used = toBool(params.is_used) ? 1 : 0;

  return Object.keys(out).length ? out : undefined;
}

export function toAdminProductStockQuery(
  params?: ProductStockAdminListParams | void,
): QueryParams | undefined {
  if (!params) return undefined;

  const out: QueryParams = {};
  if (params.product_id) out.product_id = params.product_id;
  if (typeof params.is_used !== 'undefined') out.is_used = toBool(params.is_used) ? 1 : 0;

  if (typeof params.limit === 'number') out.limit = params.limit;
  if (typeof params.offset === 'number') out.offset = params.offset;
  if (params.q) out.q = params.q;

  return Object.keys(out).length ? out : undefined;
}

export function toProductStockSetBody(body: ProductStockSetBody): Record<string, unknown> {
  return { lines: Array.isArray(body.lines) ? body.lines : [] };
}

export function toProductStockDeleteBody(body?: ProductStockDeleteBody): Record<string, unknown> {
  if (!body) return {};
  const out: Record<string, unknown> = {};
  if (typeof body.id === 'string' && body.id.trim()) out.id = body.id.trim();
  if (typeof body.code === 'string' && body.code.trim()) out.code = body.code.trim();
  return out;
}
