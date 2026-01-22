// =============================================================
// FILE: src/integrations/types/payment_providers.ts
// FINAL — Payment Providers types + helpers + normalizers + mappers
// - no-explicit-any
// - exactOptionalPropertyTypes friendly
// - uses common.ts (no duplicate helpers)
// - public_config: JsonObject | null (backend ile birebir)
// - admin secret_config: JsonObject | null
// =============================================================

import type { BoolLike, JsonObject, QueryParams } from '@/integrations/types/common';
import {
  asBoolLike,
  extractArray,
  isPlainObject,
  pickIsoOrNull,
  pickStr,
  toBool,
  toStr,
  toTrimStr,
  safeParseJson,
} from '@/integrations/types/common';

/* ----------------------------- domain types ----------------------------- */

export type PaymentProviderKey = 'stripe' | 'paytr' | 'iyzico' | string;

/** Admin model (secret_config dahil) */
export type PaymentProviderAdmin = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;

  public_config: JsonObject | null;
  secret_config: JsonObject | null;

  created_at?: string;
  updated_at?: string | null;
};

/** Public model (secret_config yok) */
export type PaymentProviderPublic = {
  id: string;
  key: PaymentProviderKey;
  display_name: string;
  is_active: boolean;

  public_config: JsonObject | null;

  created_at?: string;
  updated_at?: string | null;
};

/** Backend tolerant (snake/camel + JSON string) */
export type ApiPaymentProvider = Partial<{
  id: unknown;
  key: unknown;

  display_name: unknown;
  name: unknown;

  is_active: unknown;

  public_config: unknown; // string|object|null
  secret_config: unknown; // string|object|null (admin)

  created_at: unknown;
  updated_at: unknown;
}>;

/* ----------------------------- helpers ----------------------------- */

const pickDisplayName = (r: Record<string, unknown>): string => {
  const d =
    (typeof r.display_name === 'string' ? r.display_name : null) ??
    (typeof r.name === 'string' ? r.name : null) ??
    '';
  return d;
};

const toJsonObjectOrNull = (v: unknown): JsonObject | null => {
  if (v == null) return null;
  if (isPlainObject(v)) return v as JsonObject;
  if (typeof v === 'string') return safeParseJson<JsonObject>(v);
  return null;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizePaymentProviderAdmin(row: unknown): PaymentProviderAdmin {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const id = toTrimStr(r.id);
  const key = toTrimStr(r.key) as PaymentProviderKey;

  const created_at = pickIsoOrNull(r, ['created_at', 'createdAt']);
  const updated_at = pickIsoOrNull(r, ['updated_at', 'updatedAt']);

  const out: PaymentProviderAdmin = {
    id,
    key,
    display_name: pickDisplayName(r),
    is_active: toBool(asBoolLike(r.is_active), false),
    public_config: toJsonObjectOrNull(r.public_config),
    secret_config: toJsonObjectOrNull(r.secret_config),
    ...(created_at ? { created_at } : {}),
    ...(typeof updated_at === 'string' || updated_at === null ? { updated_at } : {}),
  };

  return out;
}

export function normalizePaymentProviderAdminList(res: unknown): PaymentProviderAdmin[] {
  return extractArray(res, ['items', 'data', 'rows', 'result']).map((x) =>
    normalizePaymentProviderAdmin(x),
  );
}

export function normalizePaymentProviderPublic(row: unknown): PaymentProviderPublic {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const created_at = pickIsoOrNull(r, ['created_at', 'createdAt']);
  const updated_at = pickIsoOrNull(r, ['updated_at', 'updatedAt']);

  const out: PaymentProviderPublic = {
    id: toTrimStr(r.id),
    key: toTrimStr(r.key) as PaymentProviderKey,
    display_name: pickDisplayName(r),
    is_active: toBool(asBoolLike(r.is_active), false),
    public_config: toJsonObjectOrNull(r.public_config),
    ...(created_at ? { created_at } : {}),
    ...(typeof updated_at === 'string' || updated_at === null ? { updated_at } : {}),
  };

  return out;
}

export function normalizePaymentProviderPublicList(res: unknown): PaymentProviderPublic[] {
  return extractArray(res, ['items', 'data', 'rows', 'result']).map((x) =>
    normalizePaymentProviderPublic(x),
  );
}

/* ----------------------------- query/body mappers ----------------------------- */

export type PaymentProvidersAdminListParams = {
  is_active?: boolean | 0 | 1;
  q?: string;
};

export type PaymentProvidersPublicListParams = {
  is_active?: boolean | 0 | 1;
  q?: string;
};

export function toPaymentProvidersListQuery(
  p?: PaymentProvidersAdminListParams | PaymentProvidersPublicListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};
  if (typeof p.is_active !== 'undefined') out.is_active = p.is_active;
  if (p.q) out.q = p.q;

  return Object.keys(out).length ? out : undefined;
}

/** Admin create/update body (FE -> BE) */
export type UpsertPaymentProviderAdminBody = Partial<{
  key: PaymentProviderKey;
  display_name: string;

  is_active: BoolLike;

  public_config: JsonObject | null;
  secret_config: JsonObject | null;
}>;

export function toUpsertPaymentProviderAdminBody(
  b: UpsertPaymentProviderAdminBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof b.key !== 'undefined') out.key = b.key;
  if (typeof b.display_name !== 'undefined') out.display_name = b.display_name;
  if (typeof b.is_active !== 'undefined') out.is_active = b.is_active;
  if (typeof b.public_config !== 'undefined') out.public_config = b.public_config;
  if (typeof b.secret_config !== 'undefined') out.secret_config = b.secret_config;

  return out;
}

/** Delete response tolerant */
export type DeleteProviderResp = { success: boolean };

export function normalizeDeleteProviderResp(res: unknown): DeleteProviderResp {
  const r = (isPlainObject(res) ? res : {}) as Record<string, unknown>;
  return { success: typeof r.success === 'boolean' ? r.success : true };
}
