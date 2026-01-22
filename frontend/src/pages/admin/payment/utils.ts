// =============================================================
// FILE: src/pages/admin/payments/utils.ts
// FINAL — Admin Payments utils (no duplicates)
// - centralizes helpers
// - uses integrations/types/common helpers
// - returns strict-friendly structures
// =============================================================

'use client';

import { toast } from 'sonner';

import type {
  AdminSiteSetting,
  UpsertSiteSettingBody,
  ValueType,
  PaymentProviderAdmin,
  PaymentProviderKey,
  UpsertPaymentProviderAdminBody,
  ProviderForm,
  PaymentMethods,
} from '@/integrations/types';

import {
  asBoolLike,
  toBool,
  toStr,
  toTrimStr,
  toNum,
  isPlainObject,
  safeParseJson,
  extractArray,
} from '@/integrations/types/common';

/* ----------------------------- URL helpers ----------------------------- */

export function buildCallbackUrl(origin: string, path: string): string {
  const o = (origin || '').trim().replace(/\/+$/, '');
  const p = (path || '').trim();
  if (!o) return p.startsWith('/') ? p : `/${p}`;
  if (!p) return o;
  return p.startsWith('/') ? `${o}${p}` : `${o}/${p}`;
}

/* ----------------------------- clipboard ----------------------------- */

export async function writeClipboard(txt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(txt);
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboardToast(txt: string): Promise<void> {
  const ok = await writeClipboard(txt);
  if (ok) toast.success('Kopyalandı');
  else toast.error('Kopyalanamadı');
}

/* ----------------------------- site_settings helpers ----------------------------- */

const PAYMENT_SITE_KEYS = new Set<string>([
  'bank_transfer_enabled',
  'bank_account_info',
  'payment_methods',
]);

export function toSiteSettingsMap(res: unknown): Map<string, AdminSiteSetting> {
  const rows = extractArray(res, ['items', 'data', 'rows', 'result']) as AdminSiteSetting[];
  const map = new Map<string, AdminSiteSetting>();

  for (const r of rows) {
    const k = toTrimStr((r as unknown as { key?: unknown }).key);
    if (k && PAYMENT_SITE_KEYS.has(k)) map.set(k, r);
  }

  return map;
}

export function readPaymentMethods(v: unknown): PaymentMethods {
  // payment_methods DB’de json string veya obj olabilir
  const obj = (() => {
    if (v == null) return null;

    if (isPlainObject(v)) return v as Record<string, unknown>;

    if (typeof v === 'string') {
      const parsed = safeParseJson<Record<string, unknown>>(v);
      return parsed && isPlainObject(parsed) ? parsed : null;
    }

    return null;
  })();

  if (!obj) return {};

  const raw = (obj as Record<string, unknown>).wallet_enabled;
  const wallet_enabled = toBool(asBoolLike(raw), false);

  // exactOptionalPropertyTypes: sadece anlamlıysa koy
  return { wallet_enabled };
}

function guessValueType(v: unknown): ValueType | null {
  if (v == null) return null;
  const t = typeof v;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'json';
}

function toPersistable(v: unknown): string | number | boolean | null {
  if (v == null) return null;
  const t = typeof v;

  if (t === 'string' || t === 'number' || t === 'boolean') {
    return v as string | number | boolean;
  }

  try {
    return JSON.stringify(v);
  } catch {
    return toStr(v);
  }
}

export function buildSitePaymentSettingsUpserts(input: {
  bankTransferEnabled: boolean;
  bankAccountInfo: string;
  paymentMethods: PaymentMethods;
}): UpsertSiteSettingBody[] {
  const { bankTransferEnabled, bankAccountInfo, paymentMethods } = input;

  const items: UpsertSiteSettingBody[] = [
    {
      key: 'bank_transfer_enabled',
      value: toPersistable(bankTransferEnabled),
      value_type: guessValueType(bankTransferEnabled),
      group: null,
      description: null,
    },
    {
      key: 'bank_account_info',
      value: toPersistable(bankAccountInfo),
      value_type: guessValueType(bankAccountInfo),
      group: null,
      description: null,
    },
    {
      key: 'payment_methods',
      value: toPersistable(paymentMethods),
      value_type: guessValueType(paymentMethods),
      group: null,
      description: null,
    },
  ];

  return items;
}

/* ----------------------------- providers helpers ----------------------------- */

export function findProvider(
  providers: PaymentProviderAdmin[],
  key: PaymentProviderKey,
): PaymentProviderAdmin | null {
  return providers.find((p) => p.key === key) ?? null;
}

function unwrapConfig(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (isPlainObject(v)) return v as Record<string, unknown>;
  if (typeof v === 'string') {
    const parsed = safeParseJson<Record<string, unknown>>(v);
    return parsed && isPlainObject(parsed) ? parsed : {};
  }
  return {};
}

export function providerToForm(p: PaymentProviderAdmin | null): ProviderForm {
  if (!p) return { enabled: false };

  const pub = unwrapConfig(p.public_config);
  const sec = unwrapConfig(p.secret_config);

  // enabled: public_config.enabled varsa onu esas al, yoksa is_active
  const enabled = toBool(asBoolLike(pub.enabled ?? p.is_active), false);

  // PayTR
  const test_mode = pub.test_mode === undefined ? true : toBool(asBoolLike(pub.test_mode), true);
  const card_commission = toNum(pub.card_commission, 0);
  const havale_enabled = toBool(asBoolLike(pub.havale_enabled), false);
  const havale_commission = toNum(pub.havale_commission, 0);

  const merchant_id = toTrimStr(sec.merchant_id);
  const merchant_key = toTrimStr(sec.merchant_key);
  const merchant_salt = toTrimStr(sec.merchant_salt);

  // Shopier
  const client_id = toTrimStr(sec.client_id);
  const client_secret = toTrimStr(sec.client_secret);
  const commission = toNum(pub.commission, 0);

  // Papara
  const api_key = toTrimStr(sec.api_key);

  return {
    enabled,

    test_mode,
    card_commission,
    havale_enabled,
    havale_commission,
    merchant_id,
    merchant_key,
    merchant_salt,

    client_id,
    client_secret,
    commission,

    api_key,
  };
}

export function buildPaytrBody(f: ProviderForm): UpsertPaymentProviderAdminBody {
  return {
    is_active: f.enabled ? 1 : 0,
    public_config: {
      enabled: f.enabled,
      test_mode: f.test_mode !== false,
      card_commission: toNum(f.card_commission, 0),
      havale_enabled: f.havale_enabled ? true : false,
      havale_commission: toNum(f.havale_commission, 0),
    },
    secret_config: {
      merchant_id: toTrimStr(f.merchant_id),
      merchant_key: toTrimStr(f.merchant_key),
      merchant_salt: toTrimStr(f.merchant_salt),
    },
  };
}

export function buildShopierBody(f: ProviderForm): UpsertPaymentProviderAdminBody {
  return {
    is_active: f.enabled ? 1 : 0,
    public_config: {
      enabled: f.enabled,
      commission: toNum(f.commission, 0),
    },
    secret_config: {
      client_id: toTrimStr(f.client_id),
      client_secret: toTrimStr(f.client_secret),
    },
  };
}

export function buildPaparaBody(f: ProviderForm): UpsertPaymentProviderAdminBody {
  return {
    is_active: f.enabled ? 1 : 0,
    public_config: {
      enabled: f.enabled,
    },
    secret_config: {
      api_key: toTrimStr(f.api_key),
    },
  };
}
