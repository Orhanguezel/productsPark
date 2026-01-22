// -------------------------------------------------------------
// FILE: src/integrations/types/normalizers/publicPaymentMethods.normalizers.ts
// FINAL
// -------------------------------------------------------------

import type {
  PublicPaymentMethod,
  PublicPaymentMethodsResp,
  PaymentProviderType,
} from '@/integrations/types';

const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const asString = (v: unknown): string | null =>
  typeof v === 'string' ? v : v == null ? null : String(v);
const asBool = (v: unknown): boolean =>
  v === true || v === 1 || v === '1' || (typeof v === 'string' && v.toLowerCase() === 'true');

const asNum = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : null;
};

const toProviderType = (v: unknown): PaymentProviderType => {
  const s = typeof v === 'string' ? v : '';
  if (s === 'wallet' || s === 'bank_transfer' || s === 'card' || s === 'manual') return s;
  return 'manual';
};

export function normalizePublicPaymentMethod(raw: unknown): PublicPaymentMethod {
  const r = isRecord(raw) ? raw : {};

  const key = asString(r.key) ?? '';
  const display_name = asString(r.display_name) ?? key;

  const type = toProviderType((isRecord(r.config) ? (r.config as Record<string, unknown>).type : undefined) ?? r.type);

  const enabled = asBool(r.enabled);
  const commission_rate = asNum(r.commission_rate);

  const config = isRecord(r.config) ? (r.config as Record<string, unknown>) : null;

  return {
    key,
    display_name,
    type,
    enabled,
    ...(commission_rate != null ? { commission_rate } : {}),
    config,
  };
}

export function normalizePublicPaymentMethodsResp(raw: unknown): PublicPaymentMethodsResp {
  const r = isRecord(raw) ? raw : {};
  const currency = asString(r.currency) ?? 'TRY';
  const guest_order_enabled = asBool(r.guest_order_enabled);

  const methodsRaw = Array.isArray(r.methods) ? r.methods : [];
  const methods = methodsRaw.map(normalizePublicPaymentMethod);

  return { currency, guest_order_enabled, methods };
}
