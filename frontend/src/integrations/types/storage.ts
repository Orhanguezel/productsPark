// ===================================================================
// FILE: src/integrations/types/storage.ts
// FINAL — Storage types + helpers + normalizers + query builders
// - no-explicit-any
// - exactOptionalPropertyTypes friendly
// ===================================================================

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { QueryParams, SortOrder } from '@/integrations/types';
import { toNum, toTrimStr, isPlainObject, clamp,toMenuItemAdminBody } from '@/integrations/types';

/* -------------------- primitives -------------------- */

export type StorageMeta = Record<string, string> | null;
export type StorageSortBy = 'created_at' | 'name' | 'size';




/* -------------------- domain types -------------------- */

export type StorageAsset = {
  id: string;
  name: string;
  bucket: string;
  path: string;
  folder: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  metadata: StorageMeta;
  created_at: string;
  updated_at: string;
};

export type ApiStorageAsset = {
  id?: unknown;
  name?: unknown;
  bucket?: unknown;
  path?: unknown;
  folder?: unknown;
  mime?: unknown;

  size?: unknown;
  width?: unknown;
  height?: unknown;

  url?: unknown;
  metadata?: unknown;

  created_at?: unknown;
  updated_at?: unknown;
};

export type StorageListQuery = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;

  limit?: number;
  offset?: number;

  sort?: StorageSortBy;
  order?: SortOrder;
};

export type StorageUpdateInput = {
  name?: string;
  folder?: string | null;
  metadata?: Record<string, string> | null;
};

/* -------------------- Public endpoints types -------------------- */

export type StorageServerUploadArgs = {
  bucket: string;
  file: File;
  path?: string;
  upsert?: boolean;
};

export type StoragePublicUploadResponse = {
  path: string;
  url: string;
};

export type StorageSignMultipartBody = {
  filename: string;
  folder?: string;
};

export type StorageSignMultipartResponse = {
  upload_url: string;
  fields: Record<string, string>;
};

/* -------------------- queryFn helper types -------------------- */

type NarrowStatus = number | 'CUSTOM_ERROR';

export function makeFetchError(status: NarrowStatus, data?: unknown): FetchBaseQueryError {
  return { status, ...(typeof data !== 'undefined' ? { data } : {}) } as FetchBaseQueryError;
}

export function normalizeBaseQueryError(err: unknown): FetchBaseQueryError {
  if (!isPlainObject(err)) return makeFetchError('CUSTOM_ERROR', { message: 'request_failed' });

  const rawStatus = (err as Record<string, unknown>)['status'];
  const status: NarrowStatus =
    typeof rawStatus === 'number' || rawStatus === 'CUSTOM_ERROR' ? rawStatus : 'CUSTOM_ERROR';

  const data =
    'data' in err
      ? (err as { data?: unknown }).data
      : { message: 'request_failed', error: 'error' in err ? err.error : undefined };

  return makeFetchError(status, data);
}

/* -------------------- helpers -------------------- */

export const sanitizeFilename = (name: string): string => name.replace(/[^\w.-]+/g, '_');

export function compactFiles(list: readonly unknown[]): File[] {
  const out: File[] = [];

  for (const f of list) {
    if (!f) continue;

    if (typeof File !== 'undefined' && f instanceof File) {
      out.push(f);
      continue;
    }

    if (typeof Blob !== 'undefined' && f instanceof Blob) {
      const blob = f;

      const name =
        typeof (blob as unknown as { name?: unknown }).name === 'string'
          ? String((blob as unknown as { name: string }).name)
          : 'blob';

      const type =
        typeof (blob as unknown as { type?: unknown }).type === 'string'
          ? String((blob as unknown as { type: string }).type)
          : 'application/octet-stream';

      try {
        out.push(new File([blob], name || 'blob', { type }));
      } catch {
        // Safari/old env fallback
        out.push(blob as unknown as File);
      }
    }
  }

  return out;
}

export function buildStorageUploadUrl(args: {
  bucket: string;
  path?: string;
  upsert?: boolean;
}): string {
  const qs = new URLSearchParams();
  if (args.path) qs.set('path', args.path);
  if (args.upsert) qs.set('upsert', '1');

  return `/storage/${encodeURIComponent(args.bucket)}/upload${qs.toString() ? `?${qs}` : ''}`;
}

/* -------------------- metadata helpers -------------------- */

export function safeParseMeta(x: unknown): StorageMeta {
  if (x == null) return null;

  if (isPlainObject(x)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(x)) {
      if (!k) continue;
      if (typeof v === 'string') out[k] = v;
      else if (typeof v === 'number' || typeof v === 'boolean') out[k] = String(v);
    }
    return Object.keys(out).length ? out : null;
  }

  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return null;
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const parsed: unknown = JSON.parse(s);
        return safeParseMeta(parsed);
      } catch {
        return null;
      }
    }
  }

  return null;
}

/* -------------------- normalizers -------------------- */

export function normalizeStorageAsset(row: unknown): StorageAsset {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const created_at = toTrimStr(r.created_at) || new Date().toISOString();
  const updated_at = toTrimStr(r.updated_at) || created_at;

  const folderRaw = r.folder;
  const folder = folderRaw == null ? null : toTrimStr(folderRaw) ? toTrimStr(folderRaw) : null;

  const urlRaw = r.url;
  const url = urlRaw == null ? null : toTrimStr(urlRaw) ? toTrimStr(urlRaw) : null;

  const widthRaw = r.width;
  const width =
    widthRaw == null ? undefined : Number.isFinite(Number(widthRaw)) ? Number(widthRaw) : null;

  const heightRaw = r.height;
  const height =
    heightRaw == null ? undefined : Number.isFinite(Number(heightRaw)) ? Number(heightRaw) : null;

  return {
    id: toTrimStr(r.id),
    name: toTrimStr(r.name),
    bucket: toTrimStr(r.bucket),
    path: toTrimStr(r.path),
    folder,
    mime: toTrimStr(r.mime),
    size: toNum(r.size, 0),

    ...(typeof width !== 'undefined' ? { width } : {}),
    ...(typeof height !== 'undefined' ? { height } : {}),
    ...(url !== null ? { url } : {}),

    metadata: safeParseMeta(r.metadata),

    created_at,
    updated_at,
  };
}

export function normalizeStorageAssetList(res: unknown): StorageAsset[] {
  if (Array.isArray(res)) return res.map((x) => normalizeStorageAsset(x));
  if (isPlainObject(res)) {
    for (const k of ['items', 'data', 'rows', 'result'] as const) {
      const v = (res as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v.map((x) => normalizeStorageAsset(x));
    }
  }
  return [];
}

/* -------------------- query builders -------------------- */

export function toStorageListQueryParams(q?: StorageListQuery | void): QueryParams | undefined {
  if (!q) return undefined;
  const out: QueryParams = {};

  if (q.q) out.q = q.q;
  if (q.bucket) out.bucket = q.bucket;

  if (typeof q.folder !== 'undefined') {
    if (typeof q.folder === 'string' && q.folder.trim()) out.folder = q.folder.trim();
  }

  if (q.mime) out.mime = q.mime;

  if (typeof q.limit === 'number') out.limit = clamp(q.limit, 1, 200);
  if (typeof q.offset === 'number') out.offset = Math.max(0, toNum(q.offset, 0));

  if (q.sort) out.sort = q.sort;
  if (q.order) out.order = q.order;

  return Object.keys(out).length ? out : undefined;
}
