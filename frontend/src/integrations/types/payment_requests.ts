// =============================================================
// FILE: src/integrations/types/payment_requests.ts
// FINAL — Payment Requests types + normalizers + mappers
// - matches backend ApiPaymentRequest exactly
// - uses common.ts helpers (no duplicate)
// =============================================================

import type { JsonObject, QueryParams } from '@/integrations/types/common';
import {
  extractArray,
  isPlainObject,
  pickIsoOrNull,
  pickOptStr,
  pickStr,
  toNum,
  toTrimStr,
} from '@/integrations/types/common';

/* ----------------------------- domain types ----------------------------- */

export type PaymentRequestStatus =
  | 'pending'
  | 'approved'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'rejected';

export type PaymentRequestRow = {
  id: string;

  order_id: string;
  user_id?: string | null;

  amount: number;
  currency: string;

  payment_method: string;
  proof_image_url?: string | null;

  status: PaymentRequestStatus;

  /** FINAL: singular */
  admin_note?: string | null;

  /** backward compat (opsiyonel) */
  admin_notes?: string | null;

  processed_at?: string | null;

  created_at?: string;
  updated_at?: string | null;

  /** bazı admin list'lerde join ile gelebilir */
  orders?: JsonObject | null;
};

/** API tolerant (snake/camel + field aliases) */
export type ApiPaymentRequestRow = Partial<{
  id: unknown;

  order_id: unknown;
  orderId: unknown;

  user_id: unknown;
  userId: unknown;

  amount: unknown;
  currency: unknown;

  payment_method: unknown;
  paymentMethod: unknown;

  proof_image_url: unknown;
  proofImageUrl: unknown;
  payment_proof: unknown; // legacy
  paymentProof: unknown; // legacy

  status: unknown;

  admin_note: unknown;
  adminNote: unknown;

  admin_notes: unknown;
  adminNotes: unknown;

  processed_at: unknown;
  processedAt: unknown;

  created_at: unknown;
  createdAt: unknown;

  updated_at: unknown;
  updatedAt: unknown;

  orders: unknown;
}>;

/* ----------------------------- normalizers ----------------------------- */

const normStatus = (x: unknown): PaymentRequestStatus => {
  const s = toTrimStr(x).toLowerCase();
  if (
    s === 'pending' ||
    s === 'approved' ||
    s === 'paid' ||
    s === 'failed' ||
    s === 'cancelled' ||
    s === 'rejected'
  ) {
    return s as PaymentRequestStatus;
  }
  return 'pending';
};

export function normalizePaymentRequestRow(row: unknown): PaymentRequestRow {
  const r = (isPlainObject(row) ? row : {}) as Record<string, unknown>;

  const id = toTrimStr(r.id);

  const order_id = pickStr(r, ['order_id', 'orderId']);
  const currency = pickStr(r, ['currency'], '');

  const payment_method = pickStr(r, ['payment_method', 'paymentMethod'], '');

  const proof_image_url =
    pickOptStr(r, ['proof_image_url', 'proofImageUrl']) ??
    pickOptStr(r, ['payment_proof', 'paymentProof']) ??
    null;

  const user_id = pickOptStr(r, ['user_id', 'userId']);

  const admin_note = pickOptStr(r, ['admin_note', 'adminNote']);
  const admin_notes = pickOptStr(r, ['admin_notes', 'adminNotes']);

  const processed_at = pickIsoOrNull(r, ['processed_at', 'processedAt']);

  const created_at = pickIsoOrNull(r, ['created_at', 'createdAt']) ?? undefined;
  const updated_at = pickIsoOrNull(r, ['updated_at', 'updatedAt']);

  const orders = isPlainObject(r.orders) ? (r.orders as JsonObject) : null;

  const out: PaymentRequestRow = {
    id,
    order_id,
    ...(user_id ? { user_id } : { user_id: null }),
    amount: toNum(r.amount, 0),
    currency,
    payment_method,
    ...(proof_image_url !== null ? { proof_image_url } : { proof_image_url: null }),
    status: normStatus(r.status),

    ...(typeof admin_note !== 'undefined' ? { admin_note } : {}),
    ...(typeof admin_notes !== 'undefined' ? { admin_notes } : {}),

    ...(typeof processed_at === 'string' || processed_at === null ? { processed_at } : {}),

    ...(created_at ? { created_at } : {}),
    ...(typeof updated_at === 'string' || updated_at === null ? { updated_at } : {}),

    ...(orders ? { orders } : {}),
  };

  return out;
}

export function normalizePaymentRequestRows(res: unknown): PaymentRequestRow[] {
  return extractArray(res, ['items', 'data', 'rows', 'result']).map((x) =>
    normalizePaymentRequestRow(x),
  );
}

/* ----------------------------- query/body mappers ----------------------------- */

export type PaymentRequestsListParams = {
  // backend user-scoped (public auth); admin’da ayrıca filtre olabilir
  user_id?: string;
  order_id?: string;
  status?: PaymentRequestStatus;

  limit?: number;
  offset?: number;
};

export function toPaymentRequestsListQuery(
  p?: PaymentRequestsListParams | void,
): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};
  if (p.user_id) out.user_id = p.user_id;
  if (p.order_id) out.order_id = p.order_id;
  if (p.status) out.status = p.status;

  if (typeof p.limit === 'number') out.limit = p.limit;
  if (typeof p.offset === 'number') out.offset = p.offset;

  return Object.keys(out).length ? out : undefined;
}

/** Public create body (backend createPaymentRequestBody ile uyumlu) */
export type CreatePaymentRequestBody = {
  id?: string;
  order_id: string;

  // public hardened controller enforce userId; ama body’de optional olabilir (ignore edilir)
  user_id?: string | null;

  amount: number | string;
  currency?: string;

  payment_method: string;

  proof_image_url?: string | null;

  status?: PaymentRequestStatus;

  admin_note?: string | null; // server store edebilir
  processed_at?: string | null;
};

/** Admin patch bodies */
export type UpdatePaymentRequestAdminBody = Partial<
  Pick<PaymentRequestRow, 'status' | 'admin_note' | 'processed_at'>
>;

export function toUpdatePaymentRequestAdminBody(
  b: UpdatePaymentRequestAdminBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof b.status !== 'undefined') out.status = b.status;
  if (typeof b.admin_note !== 'undefined') out.admin_note = b.admin_note;
  if (typeof b.processed_at !== 'undefined') out.processed_at = b.processed_at;
  return out;
}

export type SetPaymentRequestStatusAdminBody = {
  status: PaymentRequestStatus;
  admin_note?: string | null;
};

export function toSetPaymentRequestStatusAdminBody(
  b: SetPaymentRequestStatusAdminBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = { status: b.status };
  if (typeof b.admin_note !== 'undefined') out.admin_note = b.admin_note;
  return out;
}

/** delete response tolerant */
export type DeletePaymentRequestResp = { success: boolean };

export function normalizeDeletePaymentRequestResp(res: unknown): DeletePaymentRequestResp {
  const r = (isPlainObject(res) ? res : {}) as Record<string, unknown>;
  return { success: typeof r.success === 'boolean' ? r.success : true };
}
