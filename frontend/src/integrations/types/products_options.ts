// ===================================================================
// FILE: src/integrations/types/product_options.ts
// FINAL — Product Options types + normalizers + query/body mappers
// ===================================================================

import type { QueryParams } from '@/integrations/types';
import { toStr } from '@/integrations/types';

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const pickArray = (res: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of keys) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v))
    return v
      .map((x) => toStr(x))
      .map((s) => s.trim())
      .filter(Boolean);

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // json array dene
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => toStr(x))
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      // csv fallback
    }
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

/* ----------------------------- domain types ----------------------------- */

/** Public/Admin view (normalize edilmiş) */
export type ProductOption = {
  id: string;
  product_id: string;

  option_name: string;
  option_values: string[];

  created_at?: string;
  updated_at?: string;
};

/** Backend raw (tolerant: snake/camel + values string/json) */
export type ApiProductOption = Partial<{
  id: unknown;

  product_id: unknown;
  productId: unknown;

  option_name: unknown;
  optionName: unknown;

  option_values: unknown;
  optionValues: unknown;

  created_at: unknown;
  createdAt: unknown;
  updated_at: unknown;
  updatedAt: unknown;
}>;

/** Admin create input (UI) */
export type ProductOptionCreateInput = {
  id?: string;
  option_name: string;
  option_values: string[];
};

/** Admin update input */
export type ProductOptionUpdateInput = Partial<ProductOptionCreateInput>;

/** Public list params */
export type ProductOptionsListParams = {
  product_id?: string;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeProductOption(row: unknown): ProductOption {
  const r = (isObject(row) ? row : {}) as unknown as ApiProductOption;

  const id = toStr(r.id);
  const product_id = toStr(r.product_id ?? r.productId);

  const option_name = toStr(r.option_name ?? r.optionName).trim();
  const option_values = toStrArray(r.option_values ?? r.optionValues);

  const created_at = toStr(r.created_at ?? r.createdAt) || undefined;
  const updated_at = toStr(r.updated_at ?? r.updatedAt) || undefined;

  return {
    id,
    product_id,
    option_name,
    option_values,
    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeProductOptions(res: unknown): ProductOption[] {
  const rows = pickArray(res, ['data', 'items', 'rows', 'options', 'result']);
  return rows.map((x) => normalizeProductOption(x));
}

/* ----------------------------- mappers ----------------------------- */

export function toPublicProductOptionsQuery(
  params?: ProductOptionsListParams | void,
): QueryParams | undefined {
  if (!params) return undefined;

  const out: QueryParams = {};
  if (params.product_id) out.product_id = params.product_id;

  return Object.keys(out).length ? out : undefined;
}

export function toProductOptionCreateBody(b: ProductOptionCreateInput): Record<string, unknown> {
  return {
    ...(b.id ? { id: b.id } : {}),
    option_name: b.option_name,
    option_values: Array.isArray(b.option_values) ? b.option_values : [],
  };
}

export function toProductOptionUpdateBody(b: ProductOptionUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof b.id === 'string' && b.id.trim()) out.id = b.id;
  if (typeof b.option_name === 'string') out.option_name = b.option_name;
  if (Array.isArray(b.option_values)) out.option_values = b.option_values;
  return out;
}
