// =============================================================
// FILE: src/integrations/types/payment_sessions.ts
// FINAL — Payment Sessions types + normalizers + query/body mappers
// - uses common.ts (no duplicate helpers)
// - extra: JsonObject | null (backend ile birebir)
// =============================================================

import type { JsonObject, QueryParams } from '@/integrations/types/common';
import {
  extractArray,
  isPlainObject,
  pickIsoOrNull,
  pickOptStr,
  pickStr,
  safeParseJson,
  toNum,
  toTrimStr,
} from '@/integrations/types/common';

/* ----------------------------- domain types ----------------------------- */

export type PaymentSessionStatus =
  | 'requires_action'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'cancelled'
  | 'failed'
  | 'succeeded';

export type PaymentSessionRow = {
  id: string;

  provider_key: string;

  order_id?: string | null;

  amount: number;
  currency: string;

  status: PaymentSessionStatus;

  client_secret?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;

  extra?: JsonObject | null;

  created_at?: string;
  updated_at?: string | null;
};

export type ApiPaymentSessionRow = Partial<{
  id: unknown;

  provider_key: unknown;
  providerKey: unknown;

  order_id: unknown;
  orderId: unknown;

  amount: unknown;
  currency: unknown;

  status: unknown;

  client_secret: unknown;
  clientSecret: unknown;

  iframe_url: unknown;
  iframeUrl: unknown;

  redirect_url: unknown;
  redirectUrl: unknown;

  extra: unknown; // string|object|null

  created_at: unknown;
  createdAt: unknown;

  updated_at: unknown;
  updatedAt: unknown;
}>;

/* ----------------------------- normalizers ----------------------------- */

const normStatus = (x: unknown): PaymentSessionStatus => {
  const s = toTrimStr(x).toLowerCase();
  if (
    s === 'requires_action' ||
    s === 'pending' ||
    s === 'authorized' ||
    s === 'captured' ||
    s === 'cancelled' ||
    s === 'failed' ||
    s === 'succeeded'
  ) {
    return s as PaymentSessionStatus;
  }
  return 'pending';
};

const toJsonObjectOrNull = (v: unknown): JsonObject | null => {
  if (v == null) return null;
  if (isPlainObject(v)) return v as JsonObject;
  if (typeof v === 'string') return safeParseJson<JsonObject>(v);
  return null;
};

export function normalizePaymentSessionRow(row: unknown): PaymentSessionRow {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const id = toTrimStr(r.id);

  const provider_key = pickStr(r, ['provider_key', 'providerKey'], '');

  const order_id = pickOptStr(r, ['order_id', 'orderId']);

  const client_secret = pickOptStr(r, ['client_secret', 'clientSecret']);
  const iframe_url = pickOptStr(r, ['iframe_url', 'iframeUrl']);
  const redirect_url = pickOptStr(r, ['redirect_url', 'redirectUrl']);

  const extra = toJsonObjectOrNull(r.extra);

  const created_at = pickIsoOrNull(r, ['created_at', 'createdAt']) ?? undefined;
  const updated_at = pickIsoOrNull(r, ['updated_at', 'updatedAt']);

  const out: PaymentSessionRow = {
    id,
    provider_key,
    ...(typeof order_id === 'string' ? { order_id } : { order_id: null }),
    amount: toNum(r.amount, 0),
    currency: pickStr(r, ['currency'], ''),
    status: normStatus(r.status),

    ...(typeof client_secret !== 'undefined' ? { client_secret } : {}),
    ...(typeof iframe_url !== 'undefined' ? { iframe_url } : {}),
    ...(typeof redirect_url !== 'undefined' ? { redirect_url } : {}),
    ...(typeof extra !== 'undefined' ? { extra } : {}),

    ...(created_at ? { created_at } : {}),
    ...(typeof updated_at === 'string' || updated_at === null ? { updated_at } : {}),
  };

  return out;
}

export function normalizePaymentSessionRows(res: unknown): PaymentSessionRow[] {
  return extractArray(res, ['items', 'data', 'rows', 'result']).map((x) =>
    normalizePaymentSessionRow(x),
  );
}

/* ----------------------------- query/body mappers ----------------------------- */

export type PaymentSessionsListParams = {
  order_id?: string;
  provider_key?: string;
  status?: PaymentSessionStatus;

  limit?: number;
  offset?: number;
};

export function toPaymentSessionsListQuery(
  p?: PaymentSessionsListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};
  if (p.order_id) out.order_id = p.order_id;
  if (p.provider_key) out.provider_key = p.provider_key;
  if (p.status) out.status = p.status;

  if (typeof p.limit === 'number') out.limit = p.limit;
  if (typeof p.offset === 'number') out.offset = p.offset;

  return Object.keys(out).length ? out : undefined;
}

/** Public create body (backend createPaymentSessionBody ile uyumlu) */
export type CreatePaymentSessionBody = {
  provider_key: string;

  order_id?: string | null;

  amount: number | string;
  currency: string;

  success_url?: string;
  cancel_url?: string;
  return_url?: string;

  customer?: { id?: string; email?: string; name?: string };

  meta?: JsonObject;
};

/** Admin create body (admin endpoint destekliyorsa) */
export type CreatePaymentSessionAdminBody = {
  provider_key: string;

  order_id?: string | null;

  amount: number;
  currency?: string;

  extra?: JsonObject | null;

  client_secret?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;
};

export type PaymentSessionActionResp = { success: boolean; status?: PaymentSessionStatus };

export function normalizePaymentSessionActionResp(res: unknown): PaymentSessionActionResp {
  const r = (isPlainObject(res) ? res : {}) as Record<string, unknown>;
  const success = typeof r.success === 'boolean' ? r.success : true;
  const status = typeof r.status !== 'undefined' ? normStatus(r.status) : undefined;
  return { success, ...(typeof status !== 'undefined' ? { status } : {}) };
}
