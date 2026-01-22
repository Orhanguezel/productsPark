// =============================================================
// FILE: src/integrations/types/apiProviders.ts
// FINAL — Types + normalizers (central types barrel, exactOptionalPropertyTypes-safe)
// =============================================================

import { isUnknownRow } from '@/integrations/types';

/** FE'nin backend "view" yanıtıyla birebir eşleşen tip */
export type ApiProvider = {
  id: string;
  name: string;
  provider_type: string;
  api_url: string | null;
  api_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // exactOptionalPropertyTypes: property varsa undefined OLAMAZ
  credentials?: Record<string, unknown>;

  balance?: number | null;
  currency?: string | null;
  last_balance_check?: string | null;
};

export type ApiProviderBalanceResponse = {
  success: boolean;
  balance: number | null;
  currency: string | null;
  last_balance_check: string | null;
  message?: string;
  raw?: unknown;
  error?: string;
};

/* -------------------- normalizers -------------------- */

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v == null) return '';
  try {
    return String(v);
  } catch {
    return '';
  }
}

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function toOptStr(v: unknown): string | null {
  if (v == null) return null;
  const s = toStr(v).trim();
  return s ? s : null;
}

function toOptNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type CredentialsShape = {
  balance?: unknown;
  currency?: unknown;
  last_balance_check?: unknown;
};

function toCredentials(v: unknown): Record<string, unknown> | undefined {
  return isUnknownRow(v) ? v : undefined;
}

/** credentials objesi varsa onu ekler, yoksa eklemez (exactOptionalPropertyTypes-safe) */
function withCredentials<T extends Record<string, unknown>>(
  base: T,
  credentials: Record<string, unknown> | undefined,
): T & { credentials?: Record<string, unknown> } {
  return credentials ? { ...base, credentials } : base;
}

/** API provider row → ApiProvider (no-any, strict-safe) */
export function normalizeApiProvider(row: unknown): ApiProvider {
  const r = isUnknownRow(row) ? row : {};

  const id = toStr(r.id);
  const name = toStr(r.name);
  const provider_type = toStr(r.provider_type ?? r.type);

  const api_url = toOptStr(r.api_url);
  const api_key = toOptStr(r.api_key);

  const is_active = toBool(r.is_active);

  const created_at = toStr(r.created_at);
  const updated_at = toStr(r.updated_at);

  const credentials = toCredentials(r.credentials);

  const c = (credentials ?? {}) as CredentialsShape;

  const credBalance = typeof c.balance === 'number' ? c.balance : toOptNum(c.balance);
  const credCurrency = typeof c.currency === 'string' ? c.currency : toOptStr(c.currency);
  const credLastChk =
    typeof c.last_balance_check === 'string'
      ? c.last_balance_check
      : toOptStr(c.last_balance_check);

  const base: ApiProvider = {
    id,
    name,
    provider_type,
    api_url,
    api_key,
    is_active,
    created_at,
    updated_at,
    balance: toOptNum(r.balance) ?? credBalance ?? null,
    currency: toOptStr(r.currency) ?? credCurrency ?? null,
    last_balance_check: toOptStr(r.last_balance_check) ?? credLastChk ?? null,
  };

  // credentials undefined ise field eklenmez
  return withCredentials(base, credentials);
}
