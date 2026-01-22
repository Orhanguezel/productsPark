// =============================================================
// FILE: src/integrations/types/common.ts
// FINAL — Common types + type guards (no-any, strict-friendly)
// =============================================================
import { nonEmpty} from '@/integrations/types';

export type SortOrder = 'asc' | 'desc';
export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined;

export const safeJsonLd = (raw: string): object | null => {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as object;
  } catch {
    return null;
  }
};

export const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
};

/**
 * Local toBool: BoolLike union'una %100 uyumlu.
 * BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined
 */
export function toBool(v: BoolLike, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return fallback;

  const s = toStr(v).trim().toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;

  return fallback;
}

export const clamp = (n: number, min = 1, max = 200): number => Math.max(min, Math.min(max, n));



export const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);


export const toTrimStr = (v: unknown): string => toStr(v).trim();

export const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : d;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : d;
};

export const pickFirst = (src: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

export const pickStr = (src: Record<string, unknown>, keys: readonly string[], fallback = ''): string => {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : fallback;
};

export const pickOptStr = (src: Record<string, unknown>, keys: readonly string[]): string | null => {
  const v = pickFirst(src, keys);
  const s = toTrimStr(v);
  return s ? s : null;
};

export const pickIsoOrNull = (src: Record<string, unknown>, keys: readonly string[]): string | null => {
  const s = pickOptStr(src, keys);
  return s ? s : null;
};



export const toNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* -------------------- shared query param types -------------------- */

export type QueryParamPrimitive = string | number | boolean;
export type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
export type QueryParams = Record<string, QueryParamValue>;

/* -------------------- core value types -------------------- */

export type ValueType = 'string' | 'number' | 'boolean' | 'json';

export type JsonLike = string | number | boolean | null | { [k: string]: JsonLike } | JsonLike[];

export type JsonObject = Record<string, unknown>;

/** Genel satır tipi (object) */
export type UnknownRow = Record<string, unknown>;

/** unknown → object daraltma */
export function isUnknownRow(v: unknown): v is UnknownRow {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** unknown → object (array dahil değil) */
export function isObject(v: unknown): v is UnknownRow {
  return typeof v === 'object' && v !== null;
}

/** Object üzerinde güvenli property okuma (key string) */
export function getProp(obj: unknown, key: string): unknown {
  if (!isUnknownRow(obj)) return undefined;
  return obj[key];
}

/** String property okuma (trim’li) */
export function getStringProp(obj: unknown, key: string): string | undefined {
  const v = getProp(obj, key);
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

/** Number property okuma */
export function getNumberProp(obj: unknown, key: string): number | undefined {
  const v = getProp(obj, key);
  return typeof v === 'number' ? v : undefined;
}

/** Boolean property okuma */
export function getBoolProp(obj: unknown, key: string): boolean | undefined {
  const v = getProp(obj, key);
  return typeof v === 'boolean' ? v : undefined;
}


export function jsonLikeToBoolLike(v: JsonLike | undefined): BoolLike {
  // BoolLike union: boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined
  if (v === null || typeof v === 'undefined') return v;

  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'number') return v !== 0 ? 1 : 0;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1') return 'true';
    if (s === 'false' || s === '0') return 'false';

    // common aliases -> BoolLike
    if (['yes', 'y', 'on', 'enabled', 'active'].includes(s)) return 'true';
    if (['no', 'n', 'off', 'disabled', 'inactive'].includes(s)) return 'false';

    return undefined;
  }

  return undefined;
}

export function toHtml(v: JsonLike | undefined, fallbackHtml: string): string {
  return typeof v === 'string' && v.trim() ? v : fallbackHtml;
}

export function isValidEmail(email: string): boolean {
  const s = email.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}


/**
 * unknown -> BoolLike daraltma
 * (common.ts'deki BoolLike union'una %100 uyumlu)
 */
export const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v; // null | undefined
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
  }

  return undefined;
};

export const trimStr = (v: unknown): string => toStr(v).trim();

export const nullify = (v: unknown): string | null => {
  const s = trimStr(v);
  return s ? s : null;
};


export function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * unknown -> string[] | null
 * - array => string[]
 * - string => JSON array parse OR csv split
 */
export function toStrArrayOrNull(v: unknown): string[] | null {
  if (v == null) return null;

  if (Array.isArray(v)) {
    const out = v.map((x) => trimStr(x)).filter(Boolean);
    return out.length ? out : null;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // JSON array
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const out = parsed.map((x) => trimStr(x)).filter(Boolean);
        return out.length ? out : null;
      }
    } catch {
      // ignore
    }

    // CSV fallback
    const out = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return out.length ? out : null;
  }

  return null;
}


/** list meta total extractor */
export function extractTotal(res: unknown): number | null {
  if (!isObject(res)) return null;
  const raw =
    (res as Record<string, unknown>).total ??
    (res as Record<string, unknown>).count ??
    (res as Record<string, unknown>).total_count;

  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type UnknownRecord = Record<string, unknown>;

export function extractArray(
  res: unknown,
  keys: readonly string[] = ['data', 'items', 'rows', 'result', 'replies', 'tickets'],
): unknown[] {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of keys) {
      const v = (res as UnknownRecord)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}


export function safeParseJson<T>(raw: unknown): T | null {
  const s = nonEmpty(raw);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}



// -------------------- text helpers (SEO excerpts etc.) --------------------

/** HTML -> plain text (safe) */
export function stripHtmlToText(s: string): string {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text truncate with ellipsis */
export function truncateText(s: string, n: number): string {
  if (!s) return s;
  return s.length > n ? s.slice(0, Math.max(0, n - 1)) + '…' : s;
}




