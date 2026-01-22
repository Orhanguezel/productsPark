// src/modules/_shared/common.ts

import { z } from 'zod';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

export type BooleanLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

export const now = () => new Date();

// number helper
export const toNumber = (x: any) =>
  x === null || x === undefined ? x : Number.isNaN(Number(x)) ? x : Number(x);

// bool helper
export const toBool = (x: any) => (typeof x === 'boolean' ? x : Number(x) === 1);
// JSON parse helper
export const parseJson = <T>(val: any): T | null => {
  if (val == null) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
  if (typeof val === 'object') return val as T;
  return null;
};

// Drizzle where helper
export function andOrSingle<T>(conds: T[]) {
  // @ts-expect-error drizzle types
  return conds.length > 1 ? and(...conds) : conds[0];
}