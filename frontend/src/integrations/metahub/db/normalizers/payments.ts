// =============================================================
// FILE: src/integrations/metahub/db/normalizers/payments.ts
// =============================================================
import {
  ApiPaymentRow, PaymentRow,
  ApiPaymentRequestRow, PaymentRequestRow,
  ApiPaymentSessionRow, PaymentSessionRow,
  PaymentProviderRow,
} from "../types";

const toNumber = (x: unknown): number => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return Number(x ?? 0);
};
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};

export const normalizePaymentRow = (p: ApiPaymentRow): PaymentRow => ({
  ...p,
  order_id: (p.order_id ?? null) as string | null,
  reference: (p.reference ?? null) as string | null,
  transaction_id: (p.transaction_id ?? null) as string | null,
  amount_authorized: toNumber(p.amount_authorized),
  amount_captured: toNumber(p.amount_captured),
  amount_refunded: toNumber(p.amount_refunded),
  fee_amount: toNullableNumber(p.fee_amount),
  is_test: toBool(p.is_test),
  metadata: (p.metadata ?? null) as Record<string, unknown> | null,
  updated_at: p.updated_at ? toIso(p.updated_at) : null,
});
export const normalizePaymentRows = (res: unknown): PaymentRow[] =>
  Array.isArray(res) ? (res as ApiPaymentRow[]).map(normalizePaymentRow) : [];

export const normalizePaymentRequestRow = (p: ApiPaymentRequestRow): PaymentRequestRow => ({
  ...p,
  amount: toNumber(p.amount),
});
export const normalizePaymentRequestRows = (res: unknown): PaymentRequestRow[] =>
  Array.isArray(res) ? (res as ApiPaymentRequestRow[]).map(normalizePaymentRequestRow) : [];

export const normalizePaymentSessionRow = (s: ApiPaymentSessionRow): PaymentSessionRow => ({
  ...s,
  amount: toNumber(s.amount),
  extra: s.extra
    ? (typeof s.extra === "string" ? (JSON.parse(s.extra) as PaymentSessionRow["extra"]) : s.extra)
    : null,
});
export const normalizePaymentSessionRows = (res: unknown): PaymentSessionRow[] =>
  Array.isArray(res) ? (res as ApiPaymentSessionRow[]).map(normalizePaymentSessionRow) : [];

/** Provider tarafında özel parse gerekmiyor, tip net. */
export const normalizePaymentProviderRows = (res: unknown): PaymentProviderRow[] =>
  Array.isArray(res) ? (res as PaymentProviderRow[]) : [];
