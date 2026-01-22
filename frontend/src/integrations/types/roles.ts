// =============================================================
// FILE: src/integrations/types/roles.ts
// FINAL — Roles & Permissions types + normalizers + query helpers
// - strict/no-any
// - tolerant API shapes ([] or {data:[]})
// - endpoint files should import from barrel "@/integrations/types"
// =============================================================

import type { QueryParams, SortOrder } from '@/integrations/types';
import { isObject, toStr } from '@/integrations/types';

/* ----------------------------- domain types ----------------------------- */

export type Permission = {
  key: string;
  name: string;
  group: string | null;
  description: string | null;
};

export type Role = {
  slug: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string; // ISO
  updated_at: string; // ISO
};

/* ----------------------------- api raw types ----------------------------- */

export type ApiPermission = Partial<{
  key: unknown;
  name: unknown;
  group: unknown;
  description: unknown;
}>;

export type ApiRole = Partial<{
  slug: unknown;
  name: unknown;
  description: unknown;

  permissions: unknown; // string[] | string(JSON) | csv | null

  created_at: unknown; // string | number | Date
  updated_at: unknown; // string | number | Date
}>;

/* ----------------------------- list params ----------------------------- */

export type RolesListParams = {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'name';
  order?: SortOrder;
};

export type UpsertRoleBody = {
  slug: string;
  name: string;
  description?: string | null;
  permissions?: string[];
};

export type PatchRoleBody = Partial<Omit<UpsertRoleBody, 'slug'>> & { permissions?: string[] };

/* ----------------------------- internal helpers ----------------------------- */

type Obj = Record<string, unknown>;

const asObj = (v: unknown): Obj => (isObject(v) ? (v as Obj) : {});

const toNullStr = (v: unknown): string | null => {
  const s = toStr(v).trim();
  return s ? s : null;
};

const toIso = (v: unknown): string => {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.toISOString() : '';
  if (typeof v === 'number') {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.toISOString() : '';
  }
  const s = toStr(v).trim();
  if (!s) return '';
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : s;
};

const parseStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map((x) => toStr(x).trim()).filter(Boolean);

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];

    // JSON array string
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const parsed: unknown = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((x) => toStr(x).trim()).filter(Boolean);
      } catch {
        // ignore
      }
    }

    // CSV fallback
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const pluckArray = (
  res: unknown,
  keys: readonly string[] = ['data', 'items', 'rows', 'result'],
) => {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    const o = res as Obj;
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

/* ----------------------------- query helpers ----------------------------- */

export const toRolesAdminListQuery = (p?: RolesListParams | void): QueryParams | undefined => {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.q) q.q = p.q;
  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;
  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
};

/* ----------------------------- normalizers ----------------------------- */

export const normalizePermission = (row: unknown): Permission => {
  const r = asObj(row);

  return {
    key: toStr(r.key).trim(),
    name: toStr(r.name).trim(),
    group: toNullStr(r.group),
    description: toNullStr(r.description),
  };
};

export const normalizePermissions = (res: unknown): Permission[] =>
  pluckArray(res, ['data', 'items', 'rows', 'result', 'permissions']).map((x) =>
    normalizePermission(x),
  );

export const normalizeRole = (row: unknown): Role => {
  const r = asObj(row);

  const slug = toStr(r.slug).trim();
  const name = toStr(r.name).trim();
  const description = toNullStr(r.description);

  const perms = parseStringArray(r.permissions);

  const created = toIso(r.created_at);
  const updated = toIso(r.updated_at);

  return {
    slug,
    name,
    description,
    permissions: perms,
    created_at: created || '',
    updated_at: updated || created || '',
  };
};

export const normalizeRoles = (res: unknown): Role[] =>
  pluckArray(res, ['data', 'items', 'rows', 'result', 'roles']).map((x) => normalizeRole(x));
