// src/modules/payments/admin.utils.ts
import { sql } from 'drizzle-orm';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue };

export const toNum = (x: unknown): number => {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    const n = Number(x.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return Number(x ?? 0);
};

export const toDecimal = (x: unknown): string => toNum(x).toFixed(2);

export const toJsonString = (v: unknown): string | null =>
  v == null ? null : JSON.stringify(v as JsonValue);

export const parseJsonObject = (
  v: unknown
): Record<string, unknown> | null => {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v);
      return typeof o === 'object' && o && !Array.isArray(o)
        ? (o as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
};

export function isDupErr(e: unknown) {
  const msg = String((e as any)?.message ?? '');
  const code = (e as any)?.code;
  return code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(msg);
}

export function hasNoSecretCol(e: unknown) {
  const msg = String((e as any)?.message ?? '');
  return /Unknown column 'secret_config'/i.test(msg);
}

// İstersen ileride nullable LIKE helper'ını da buraya taşıyabilirsin:
// export const likeNullable = (col: unknown, pattern: string): SQL =>
//   sql`${col} IS NOT NULL AND ${col} LIKE ${pattern}`;
