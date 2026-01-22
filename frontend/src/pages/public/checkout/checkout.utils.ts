// =============================================================
// FILE: src/pages/public/checkout/checkout.utils.ts
// FINAL — Checkout helpers (no-any, strict-friendly)
// - Uses integrations/types barrel helpers
// =============================================================

import type { CheckoutData } from '@/integrations/types';
import type { CreateOrderItemBody, PublicPaymentMethod } from '@/integrations/types';
import type { CheckoutPaymentMethodOption } from '@/integrations/types';

import { isPlainObject, toNum, toTrimStr, pickOptStr, pickStr } from '@/integrations/types';


type AuthUserLike = { email?: unknown } | null | undefined;

/* -------------------- money helpers -------------------- */

export const money2 = (n: number): string => (Number.isFinite(n) ? n : 0).toFixed(2);

/* -------------------- wallet balance extractor -------------------- */
/**
 * API response can be:
 * - number
 * - string
 * - { balance }
 * - { data: { balance } }
 */
export function extractWalletBalance(raw: unknown, fallback = 0): number {
  if (typeof raw === 'number' || typeof raw === 'string') return toNum(raw, fallback);

  if (isPlainObject(raw)) {
    const b = (raw as Record<string, unknown>).balance;
    if (typeof b === 'number' || typeof b === 'string') return toNum(b, fallback);

    const data = (raw as Record<string, unknown>).data;
    if (isPlainObject(data)) {
      const b2 = (data as Record<string, unknown>).balance;
      if (typeof b2 === 'number' || typeof b2 === 'string') return toNum(b2, fallback);
    }
  }

  return fallback;
}

/* -------------------- public payment method helpers -------------------- */

export function getCommissionRateFromMethod(m?: PublicPaymentMethod | null): number {
  if (!m) return 0;

  // prefer top-level commission_rate
  if (isPlainObject(m as unknown)) {
    const cr = (m as unknown as Record<string, unknown>).commission_rate;
    if (typeof cr === 'number' || typeof cr === 'string') return toNum(cr, 0);
  }

  // fallback: config.commission
  const cfg = isPlainObject((m as any).config)
    ? ((m as any).config as Record<string, unknown>)
    : null;
  if (!cfg) return 0;

  const c = (cfg as Record<string, unknown>).commission;
  return toNum(c, 0);
}

export type BankTransferKind = 'havale' | 'eft';

export type BankAccountInfo = {
  iban: string | null;
  account_holder: string | null;
  bank_name: string | null;
};

function pickBankAccountFromConfig(
  cfg: Record<string, unknown> | null,
  kind: BankTransferKind,
): BankAccountInfo {
  if (!cfg) return { iban: null, account_holder: null, bank_name: null };

  const hv = isPlainObject((cfg as any).havale)
    ? ((cfg as any).havale as Record<string, unknown>)
    : null;
  const ef = isPlainObject((cfg as any).eft) ? ((cfg as any).eft as Record<string, unknown>) : null;

  const selected = kind === 'eft' ? (ef ?? hv) : (hv ?? ef);
  if (!selected) return { iban: null, account_holder: null, bank_name: null };

  return {
    iban: pickOptStr(selected, ['iban']),
    account_holder: pickOptStr(selected, ['account_holder', 'accountHolder', 'holder']),
    bank_name: pickOptStr(selected, ['bank_name', 'bankName']),
  };
}

/**
 * Build Checkout UI options from backend-driven public methods.
 * - Keeps all enabled methods
 * - Enriches bank_transfer with account info (based on kind)
 * - Ensures wallet appears (optional) even if backend doesn't list it
 */
export function buildCheckoutPaymentOptions(args: {
  methods: PublicPaymentMethod[];
  bankTransferKind: BankTransferKind;
  ensureWallet?: boolean;
}): CheckoutPaymentMethodOption[] {
  const { methods, bankTransferKind, ensureWallet = true } = args;

  const out: CheckoutPaymentMethodOption[] = [];

  for (const m of methods) {
    if (!m || !(m as any).enabled) continue;

    const id = toTrimStr((m as any).key);
    if (!id) continue;

    const name = toTrimStr((m as any).display_name) || id;

    if ((m as any).type === 'bank_transfer') {
      const cfg = isPlainObject((m as any).config)
        ? ((m as any).config as Record<string, unknown>)
        : null;
      const acc = pickBankAccountFromConfig(cfg, bankTransferKind);

      out.push({
        id,
        name,
        enabled: true,
        ...(acc.iban ? { iban: acc.iban } : {}),
        ...(acc.account_holder ? { account_holder: acc.account_holder } : {}),
        ...(acc.bank_name ? { bank_name: acc.bank_name } : {}),
      });
      continue;
    }

    out.push({ id, name, enabled: true });
  }

  if (ensureWallet && !out.some((x) => x.id === 'wallet')) {
    out.unshift({ id: 'wallet', name: 'Cüzdan', enabled: true });
  }

  return out;
}

/* -------------------- order item builder -------------------- */

export function buildOrderItemsFromCheckout(checkoutData: CheckoutData): CreateOrderItemBody[] {
  const items = (checkoutData as any).cartItems as any[];
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const priceNum = toNum(item?.products?.price, 0);
    const quantityNum = toNum(item?.quantity, 1);
    const totalNum = priceNum * quantityNum;

    return {
      product_id: String(item?.products?.id ?? ''),
      product_name: String(item?.products?.name ?? ''),
      quantity: Number.isFinite(quantityNum) ? quantityNum : 1,
      price: money2(priceNum),
      total: money2(totalNum),
      options: item?.selected_options ?? null,
    };
  });
}

/* -------------------- checkout totals -------------------- */

export function getCheckoutTotal(checkoutData: CheckoutData): number {
  return toNum((checkoutData as any)?.total, 0);
}





export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

function unwrapProfile(p: unknown): Record<string, unknown> | null {
  if (!isPlainObject(p)) return null;
  // some APIs return { data: {...} }
  const d = (p as Record<string, unknown>).data;
  if (isPlainObject(d)) return d as Record<string, unknown>;
  return p as Record<string, unknown>;
}

export function extractCustomerInfo(profileData: unknown, authUser: AuthUserLike): CustomerInfo {
  const p = unwrapProfile(profileData);

  const name =
    (p ? pickStr(p, ['full_name', 'fullName', 'name'], '') : '') ||
    (p ? pickStr(p, ['first_name', 'firstName'], '') : '');

  const emailFromAuth =
    authUser && typeof (authUser as any).email === 'string' ? toTrimStr((authUser as any).email) : '';

  const email =
    emailFromAuth ||
    (p ? pickStr(p, ['email', 'mail', 'user_email', 'userEmail'], '') : '');

  const phone =
    (p ? pickStr(p, ['phone', 'phone_number', 'phoneNumber', 'mobile', 'mobile_phone'], '') : '') || '';

  return {
    name: toTrimStr(name),
    email: toTrimStr(email),
    phone: toTrimStr(phone),
  };
}

