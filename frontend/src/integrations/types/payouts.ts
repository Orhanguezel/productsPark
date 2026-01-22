// ===================================================================
// FILE: src/integrations/types/payouts.ts
// FINAL — Payouts (Admin) types + helpers + normalizers + mappers
// ===================================================================

/* ----------------------------- primitives ----------------------------- */
import type { BoolLike, QueryParams } from '@/integrations/types';
import { toBool,toNum,toStr } from '@/integrations/types';

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);



export function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.valueOf()) ? d.toISOString() : null;
}

function extractArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of ['data', 'items', 'rows', 'result'] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
}

/* ----------------------------- domain types ----------------------------- */

export type PayoutStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled';

export type PayoutMethod = 'bank_transfer' | 'wallet' | 'ach' | 'sepa' | 'other';

export type Payout = {
  id: string;
  batch_id: string | null;
  destination: string;
  vendor_id: string | null;

  method: PayoutMethod;

  currency: string;

  amount: number; // minor units
  fee_amount: number; // minor units
  net_amount: number; // minor units

  reference: string | null;
  status: PayoutStatus;

  scheduled_at: string | null; // ISO
  processed_at: string | null; // ISO
  created_at: string; // ISO
  updated_at: string | null; // ISO

  error_code?: string | null;
  error_message?: string | null;

  metadata?: Record<string, unknown> | null;
};

export type ApiPayout = Omit<
  Payout,
  'amount' | 'fee_amount' | 'net_amount' | 'scheduled_at' | 'processed_at' | 'updated_at'
> & {
  amount: number | string;
  fee_amount: number | string;
  net_amount: number | string;
  scheduled_at?: unknown;
  processed_at?: unknown;
  updated_at?: unknown;
  metadata?: unknown;
};

export function normalizePayout(row: unknown): Payout {
  const r = (isObject(row) ? row : {}) as Record<string, unknown>;
  const p = r as unknown as ApiPayout;

  return {
    ...p,

    id: toStr(p.id),
    batch_id: (p.batch_id ?? null) as string | null,
    vendor_id: (p.vendor_id ?? null) as string | null,

    destination: toStr((p as { destination?: unknown }).destination),
    method: ((p as { method?: unknown }).method as PayoutMethod) ?? 'other',
    currency: toStr((p as { currency?: unknown }).currency),

    reference: (p.reference ?? null) as string | null,

    status: ((p as { status?: unknown }).status as PayoutStatus) ?? 'pending',

    amount: toNum(p.amount),
    fee_amount: toNum(p.fee_amount),
    net_amount: toNum(p.net_amount),

    scheduled_at: toIsoOrNull(p.scheduled_at),
    processed_at: toIsoOrNull(p.processed_at),
    updated_at: toIsoOrNull(p.updated_at),

    // created_at zorunlu, invalid ise string'e zorla (backend zaten ISO dönmeli)
    created_at: toStr((p as { created_at?: unknown }).created_at),

    error_code: (p.error_code ?? null) as string | null,
    error_message: (p.error_message ?? null) as string | null,

    metadata: isObject(p.metadata) ? (p.metadata as Record<string, unknown>) : null,
  };
}

export function normalizePayouts(res: unknown): Payout[] {
  return extractArray(res).map((x) => normalizePayout(x));
}

/* ----------------------------- list/query types ----------------------------- */

export type PayoutListParams = {
  q?: string;
  status?: PayoutStatus;
  vendor_id?: string;
  batch_id?: string;
  method?: PayoutMethod;

  created_from?: string; // ISO (string)
  created_to?: string; // ISO
  processed_from?: string; // ISO
  processed_to?: string; // ISO

  min_amount?: number; // minor units
  max_amount?: number; // minor units

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'processed_at' | 'amount' | 'status';
  order?: 'asc' | 'desc';
};

export function toPayoutListQuery(p?: PayoutListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const out: QueryParams = {};

  if (p.q) out.q = p.q;
  if (p.status) out.status = p.status;
  if (p.vendor_id) out.vendor_id = p.vendor_id;
  if (p.batch_id) out.batch_id = p.batch_id;
  if (p.method) out.method = p.method;

  if (p.created_from) out.created_from = p.created_from;
  if (p.created_to) out.created_to = p.created_to;
  if (p.processed_from) out.processed_from = p.processed_from;
  if (p.processed_to) out.processed_to = p.processed_to;

  if (typeof p.min_amount === 'number') out.min_amount = p.min_amount;
  if (typeof p.max_amount === 'number') out.max_amount = p.max_amount;

  if (typeof p.limit === 'number') out.limit = p.limit;
  if (typeof p.offset === 'number') out.offset = p.offset;

  if (p.sort) out.sort = p.sort;
  if (p.order) out.order = p.order;

  return Object.keys(out).length ? out : undefined;
}

/* ----------------------------- actions bodies ----------------------------- */

export type ApprovePayoutBody = { note?: string | null };
export type DenyPayoutBody = { reason?: string | null };
export type ExecutePayoutBody = { force?: BoolLike };
export type RetryPayoutBody = { reason?: string | null };
export type CancelPayoutBody = { reason?: string | null };

export function toExecuteBody(b?: ExecutePayoutBody): Record<string, unknown> | undefined {
  if (!b) return undefined;
  if (typeof b.force === 'undefined') return undefined;
  return { force: toBool(b.force) ? 1 : 0 };
}

/* ----------------------------- export ----------------------------- */

export type PayoutsExportParams = PayoutListParams & { format?: 'csv' | 'xlsx' };

export type ExportResponse = { url: string; expires_at: string | null };

export function normalizeExportResponse(res: unknown): ExportResponse {
  const r = (isObject(res) ? res : {}) as Record<string, unknown>;
  return {
    url: toStr(r.url),
    expires_at: toIsoOrNull(r.expires_at),
  };
}

/* ----------------------------- batches ----------------------------- */

export type PayoutBatchStatus =
  | 'draft'
  | 'finalized'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled';

export type PayoutBatch = {
  id: string;
  title: string | null;
  currency: string;

  total_count: number;
  total_amount: number; // minor units

  status: PayoutBatchStatus;

  created_at: string; // ISO
  finalized_at: string | null; // ISO
};

export type ApiPayoutBatch = Omit<PayoutBatch, 'total_amount' | 'finalized_at'> & {
  total_amount: number | string;
  finalized_at?: unknown;
};

export function normalizePayoutBatch(row: unknown): PayoutBatch {
  const r = (isObject(row) ? row : {}) as Record<string, unknown>;
  const b = r as unknown as ApiPayoutBatch;

  return {
    ...b,
    id: toStr(b.id),
    title: (b.title ?? null) as string | null,
    currency: toStr((b as { currency?: unknown }).currency),

    total_count: toNum((b as { total_count?: unknown }).total_count, 0),
    total_amount: toNum(b.total_amount, 0),

    status: ((b as { status?: unknown }).status as PayoutBatchStatus) ?? 'draft',

    created_at: toStr((b as { created_at?: unknown }).created_at),
    finalized_at: toIsoOrNull(b.finalized_at),
  };
}

/** Batch create */
export type CreateBatchBody = {
  title?: string | null;
  currency: string;
  items: Array<{
    destination: string;
    amount: number; // minor units
    vendor_id?: string | null;
    method: PayoutMethod;
    reference?: string | null;
  }>;
};
