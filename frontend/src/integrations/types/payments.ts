// =============================================================
// FILE: src/integrations/types/payments.ts
// FINAL — Payments types + helpers + normalizers + query/body mappers
// - strict/no-any
// - central common: isObject/toStr + QueryParams
// - endpoint dosyalarında helper/normalizer yok
// =============================================================

import type { PaymentProviderKey } from '@/integrations/types';
import type { QueryParams, PaymentStatus } from '@/integrations/types';
import { toNum } from '@/integrations/types';


export const PAYTR_KEY = 'paytr' as const;
export const SHOPIER_KEY = 'shopier' as const;
export const PAPARA_KEY = 'papara' as const;



/* ----------------------------- domain types ----------------------------- */

export type PaymentsAdminSortKey =
  | 'created_at'
  | 'updated_at'
  | 'amount_captured'
  | 'amount_authorized'
  | 'status';

export type PaymentsAdminListParams = {
  q?: string;
  provider?: string;
  status?: PaymentStatus;
  order_id?: string;

  is_test?: boolean;

  min_amount?: number;
  max_amount?: number;

  starts_at?: string; // ISO
  ends_at?: string; // ISO

  limit?: number;
  offset?: number;

  sort?: PaymentsAdminSortKey;
  order?: 'asc' | 'desc';

  include?: Array<'order'>;
};

export type CaptureBody = { amount?: number | null; idempotency_key?: string | null };
export type RefundBody = { amount?: number | null; reason?: string | null };
export type VoidBody = { reason?: string | null };

export type PaymentRow = {
  id: string;
  order_id: string | null;

  provider: string;
  currency: string;

  amount_authorized: number;
  amount_captured: number;
  amount_refunded: number;
  fee_amount: number | null;

  status: PaymentStatus;

  reference: string | null;
  transaction_id: string | null;

  is_test: boolean;
  metadata?: Record<string, unknown> | null;

  created_at: string; // ISO
  updated_at: string | null; // ISO
};

export type PaymentEventRow = {
  id: string;
  payment_id: string;
  event_type:
    | 'status_change'
    | 'webhook'
    | 'capture'
    | 'refund'
    | 'void'
    | 'note'
    | 'sync'
    | 'error'
    | (string & {});
  message: string;
  raw?: Record<string, unknown> | null;
  created_at: string; // ISO
};

/* ----------------------------- API raw (tolerant) ----------------------------- */

export type ApiPaymentRow = Partial<{
  id: unknown;
  order_id: unknown;
  orderId: unknown;

  provider: unknown;
  currency: unknown;

  amount_authorized: unknown;
  amountAuthorized: unknown;

  amount_captured: unknown;
  amountCaptured: unknown;

  amount_refunded: unknown;
  amountRefunded: unknown;

  fee_amount: unknown;
  feeAmount: unknown;

  status: unknown;

  reference: unknown;
  transaction_id: unknown;
  transactionId: unknown;

  is_test: unknown;
  isTest: unknown;

  metadata: unknown;

  created_at: unknown;
  createdAt: unknown;

  updated_at: unknown;
  updatedAt: unknown;
}>;

export type ApiPaymentEventRow = Partial<{
  id: unknown;
  payment_id: unknown;
  paymentId: unknown;

  event_type: unknown;
  eventType: unknown;

  message: unknown;
  raw: unknown;

  created_at: unknown;
  createdAt: unknown;
}>;








export type KnownProviderKey = typeof PAYTR_KEY | typeof SHOPIER_KEY | typeof PAPARA_KEY;

export const PAYMENT_SITE_KEYS = [
  'bank_transfer_enabled',
  'bank_account_info',
  'payment_methods',
] as const;

export type PaymentSiteKey = (typeof PAYMENT_SITE_KEYS)[number];

/**
 * site_settings.payment_methods (JSON) minimal shape
 * - genişleyebilir; UI sadece wallet flag ile ilgileniyor.
 */
export type PaymentMethods = {
  wallet_enabled?: boolean;
};

/**
 * Provider edit form (admin UI)
 * - genişlemeye açık; provider bazlı alanlar opsiyonel
 */
export type ProviderForm = {
  enabled: boolean;

  // PayTR
  test_mode?: boolean;
  card_commission?: number;
  havale_enabled?: boolean;
  havale_commission?: number;
  merchant_id?: string;
  merchant_key?: string;
  merchant_salt?: string;

  // Shopier
  client_id?: string;
  client_secret?: string;
  commission?: number;

  // Papara
  api_key?: string;
};

/**
 * Provider create default labels
 */
export const PROVIDER_DISPLAY_NAMES: Record<KnownProviderKey, string> = {
  [PAYTR_KEY]: 'PayTR',
  [SHOPIER_KEY]: 'Shopier',
  [PAPARA_KEY]: 'Papara',
};

/**
 * UI -> API provider key casting helper (if needed)
 */
export const asPaymentProviderKey = (k: KnownProviderKey): PaymentProviderKey => k;


























/* ----------------------------- internal helpers ----------------------------- */

type Obj = Record<string, unknown>;

const DEFAULT_PLUCK_KEYS = ['data', 'items', 'rows', 'result', 'payments'] as const;
const DEFAULT_EVENT_PLUCK_KEYS = ['data', 'items', 'rows', 'result', 'events'] as const;

const pickFirst = (src: Obj, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

const pickTrimStr = (src: Obj, keys: readonly string[], fallback = ''): string => {
  const s = toStr(pickFirst(src, keys)).trim();
  return s ? s : fallback;
};

const pickOptTrimStr = (src: Obj, keys: readonly string[]): string | null => {
  const s = toStr(pickFirst(src, keys)).trim();
  return s ? s : null;
};

const toBool = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return fallback;
  const s = toStr(v).trim().toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return fallback;
};

const pluckArray = (res: unknown, keys: readonly string[]): unknown[] => {
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

const toObjOrNull = (v: unknown): Record<string, unknown> | null =>
  isObject(v) ? (v as Record<string, unknown>) : null;

/* ----------------------------- query/body mappers ----------------------------- */

export const toPaymentsAdminListQuery = (
  p?: PaymentsAdminListParams | void,
): QueryParams | undefined => {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.q) q.q = p.q;
  if (p.provider) q.provider = p.provider;
  if (p.status) q.status = p.status;
  if (p.order_id) q.order_id = p.order_id;

  if (typeof p.is_test === 'boolean') q.is_test = p.is_test ? 1 : 0;

  if (typeof p.min_amount === 'number') q.min_amount = p.min_amount;
  if (typeof p.max_amount === 'number') q.max_amount = p.max_amount;

  if (p.starts_at) q.starts_at = p.starts_at;
  if (p.ends_at) q.ends_at = p.ends_at;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  if (p.include && p.include.length) q.include = p.include.join(',');

  return Object.keys(q).length ? q : undefined;
};

export const toCaptureBody = (b?: CaptureBody): Record<string, unknown> | undefined => {
  if (!b) return undefined;
  const out: Record<string, unknown> = {};
  if (typeof b.amount === 'number') out.amount = b.amount;
  if (b.amount === null) out.amount = null;
  if (typeof b.idempotency_key === 'string') out.idempotency_key = b.idempotency_key;
  if (b.idempotency_key === null) out.idempotency_key = null;
  return Object.keys(out).length ? out : undefined;
};

export const toRefundBody = (b?: RefundBody): Record<string, unknown> | undefined => {
  if (!b) return undefined;
  const out: Record<string, unknown> = {};
  if (typeof b.amount === 'number') out.amount = b.amount;
  if (b.amount === null) out.amount = null;
  if (typeof b.reason === 'string') out.reason = b.reason;
  if (b.reason === null) out.reason = null;
  return Object.keys(out).length ? out : undefined;
};

export const toVoidBody = (b?: VoidBody): Record<string, unknown> | undefined => {
  if (!b) return undefined;
  const out: Record<string, unknown> = {};
  if (typeof b.reason === 'string') out.reason = b.reason;
  if (b.reason === null) out.reason = null;
  return Object.keys(out).length ? out : undefined;
};

/* ----------------------------- normalizers ----------------------------- */

export const normalizePaymentRow = (row: unknown): PaymentRow => {
  const r: Obj = isObject(row) ? (row as Obj) : {};
  const api: ApiPaymentRow = isObject(row) ? (row as unknown as ApiPaymentRow) : {};

  const id = pickTrimStr(r, ['id'], toStr(api.id).trim());
  const order_id =
    pickOptTrimStr(r, ['order_id', 'orderId']) ??
    (toStr(api.order_id ?? (api as Obj).orderId).trim() || null);

  const provider = pickTrimStr(r, ['provider'], toStr(api.provider).trim());
  const currency = pickTrimStr(r, ['currency'], toStr(api.currency).trim());

  const amount_authorized = toNum(
    pickFirst(r, ['amount_authorized', 'amountAuthorized', 'amount_authorized']),
    toNum((api as Obj).amount_authorized ?? (api as Obj).amountAuthorized, 0),
  );
  const amount_captured = toNum(
    pickFirst(r, ['amount_captured', 'amountCaptured']),
    toNum((api as Obj).amount_captured ?? (api as Obj).amountCaptured, 0),
  );
  const amount_refunded = toNum(
    pickFirst(r, ['amount_refunded', 'amountRefunded']),
    toNum((api as Obj).amount_refunded ?? (api as Obj).amountRefunded, 0),
  );
  const fee_amount_raw = pickFirst(r, ['fee_amount', 'feeAmount']);
  const fee_amount = fee_amount_raw == null ? null : toNum(fee_amount_raw, 0);

  const status =
    ((pickFirst(r, ['status']) ?? (api as Obj).status) as PaymentStatus) ??
    ('unknown' as PaymentStatus);

  const reference =
    pickOptTrimStr(r, ['reference']) ?? (toStr((api as Obj).reference).trim() || null);

  const transaction_id =
    pickOptTrimStr(r, ['transaction_id', 'transactionId']) ??
    (toStr((api as Obj).transaction_id ?? (api as Obj).transactionId).trim() || null);

  const is_test = toBool(
    pickFirst(r, ['is_test', 'isTest']),
    toBool((api as Obj).is_test ?? (api as Obj).isTest, false),
  );

  const metadata = (() => {
    const m = pickFirst(r, ['metadata']);
    if (typeof m === 'undefined')
      return typeof (api as Obj).metadata === 'undefined'
        ? null
        : toObjOrNull((api as Obj).metadata);
    return toObjOrNull(m);
  })();

  const created_at = pickTrimStr(
    r,
    ['created_at', 'createdAt'],
    toStr((api as Obj).created_at ?? (api as Obj).createdAt).trim(),
  );

  const updated_at_raw =
    pickOptTrimStr(r, ['updated_at', 'updatedAt']) ??
    (toStr((api as Obj).updated_at ?? (api as Obj).updatedAt).trim() || null);

  return {
    id,
    order_id,
    provider,
    currency,
    amount_authorized,
    amount_captured,
    amount_refunded,
    fee_amount,
    status,
    reference,
    transaction_id,
    is_test,
    ...(typeof metadata !== 'undefined' ? { metadata } : {}),
    created_at,
    updated_at: updated_at_raw,
  };
};

export const normalizePaymentRows = (res: unknown): PaymentRow[] =>
  pluckArray(res, DEFAULT_PLUCK_KEYS).map((x) => normalizePaymentRow(x));

export const normalizePaymentEventRow = (row: unknown): PaymentEventRow => {
  const r: Obj = isObject(row) ? (row as Obj) : {};
  const api: ApiPaymentEventRow = isObject(row) ? (row as unknown as ApiPaymentEventRow) : {};

  const id = pickTrimStr(r, ['id'], toStr(api.id).trim());
  const payment_id = pickTrimStr(
    r,
    ['payment_id', 'paymentId'],
    toStr((api as Obj).payment_id ?? (api as Obj).paymentId).trim(),
  );

  const event_type = (pickTrimStr(
    r,
    ['event_type', 'eventType'],
    toStr((api as Obj).event_type ?? (api as Obj).eventType).trim(),
  ) || 'note') as PaymentEventRow['event_type'];

  const message = pickTrimStr(r, ['message'], toStr((api as Obj).message).trim());

  const raw = (() => {
    const v = pickFirst(r, ['raw']);
    if (typeof v === 'undefined')
      return typeof (api as Obj).raw === 'undefined' ? null : toObjOrNull((api as Obj).raw);
    return toObjOrNull(v);
  })();

  const created_at = pickTrimStr(
    r,
    ['created_at', 'createdAt'],
    toStr((api as Obj).created_at ?? (api as Obj).createdAt).trim(),
  );

  return {
    id,
    payment_id,
    event_type,
    message,
    ...(raw ? { raw } : {}),
    created_at,
  };
};

export const normalizePaymentEvents = (res: unknown): PaymentEventRow[] =>
  pluckArray(res, DEFAULT_EVENT_PLUCK_KEYS).map((x) => normalizePaymentEventRow(x));


// =============================================================
// FILE: src/pages/public/components/types.ts
// =============================================================

/**
 * Checkout tarafı için minimal ama strict tipler.
 * cartItems içini burada modellemiyoruz; sadece array olduğuna bakıyoruz.
 */

export type CheckoutCoupon = {
  id: string;
  code: string;
} | null;

export interface CheckoutData {
  cartItems: unknown[];      // ✅ any yok
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: CheckoutCoupon;
  notes?: string | null;
}

/**
 * PaymentMethod: bank alanları optional (UI/ekranda gösterim için)
 */
export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  iban?: string;
  account_holder?: string;
  bank_name?: string;
}

/* ----------------------------- helpers ----------------------------- */

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);

const toStr = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
};

const toOptStr = (v: unknown): string | null => {
  const s = toStr(v, "").trim();
  return s ? s : null;
};

/* ----------------------------- normalizer ----------------------------- */

/**
 * sessionStorage’dan gelen checkoutData için güvenli normalize.
 * Hatalıysa null döndürür (caller redirect/toast yapar).
 */
export function normalizeCheckoutData(input: unknown): CheckoutData | null {
  if (!isObject(input)) return null;

  const cartItems =
    Array.isArray(input.cartItems)
      ? input.cartItems
      : pluckArray(input, ["items", "cart_items", "cart"]);

  if (!Array.isArray(cartItems) || cartItems.length === 0) return null;

  const subtotal = toNum(input.subtotal, NaN);
  const discount = toNum(input.discount, 0);
  const total = toNum(input.total, NaN);

  if (!Number.isFinite(subtotal) || !Number.isFinite(total)) return null;

  // appliedCoupon tolerant: null | object | undefined
  let appliedCoupon: CheckoutCoupon = null;
  const c = input.appliedCoupon;

  if (isObject(c)) {
    const id = toStr(c.id).trim();
    const code = toStr(c.code).trim();
    if (id && code) appliedCoupon = { id, code };
  }

  const notes = toOptStr(input.notes);

  return {
    cartItems,
    subtotal,
    discount,
    total,
    appliedCoupon,
    ...(notes !== null ? { notes } : {}),
  };
}

