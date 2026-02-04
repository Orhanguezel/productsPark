// =============================================================
// FILE: src/pages/public/checkout/checkout.utils.ts
// FINAL — Checkout helpers (no-any, strict-friendly)
// - Provider key is single ID everywhere
// - bank_transfer enriched by kind (havale/eft) but ID stays 'bank_transfer'
// =============================================================

import type { CheckoutData } from '@/integrations/types';
import type { CreateOrderItemBody, PublicPaymentMethod } from '@/integrations/types';
import type { CheckoutPaymentMethodOption } from '@/integrations/types';

import { isPlainObject, toNum, toTrimStr, pickOptStr, pickStr } from '@/integrations/types';

type AuthUserLike = { email?: unknown } | null | undefined;

/* -------------------- money helpers -------------------- */
export const money2 = (n: number): string => (Number.isFinite(n) ? n : 0).toFixed(2);

/* -------------------- wallet balance extractor -------------------- */
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
 * - Bank transfer enriched with account info (based on kind), but ID remains 'bank_transfer'
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

    const key = toTrimStr((m as any).key);
    if (!key) continue;

    const name = toTrimStr((m as any).display_name) || key;
    const type = toTrimStr((m as any).type);

    if (type === 'bank_transfer' || key === 'bank_transfer') {
      const cfg = isPlainObject((m as any).config)
        ? ((m as any).config as Record<string, unknown>)
        : null;

      const acc = pickBankAccountFromConfig(cfg, bankTransferKind);

      out.push({
        id: 'bank_transfer', // ✅ force provider key
        name,
        enabled: true,
        ...(acc.iban ? { iban: acc.iban } : {}),
        ...(acc.account_holder ? { account_holder: acc.account_holder } : {}),
        ...(acc.bank_name ? { bank_name: acc.bank_name } : {}),
      });

      continue;
    }

    out.push({ id: key, name, enabled: true });
  }

  if (ensureWallet && !out.some((x) => x.id === 'wallet')) {
    out.unshift({ id: 'wallet', name: 'Cüzdan', enabled: true });
  }

  return out;
}

/* -------------------- order item builder -------------------- */

type CheckoutCartItemLike = {
  quantity?: unknown;
  products?: {
    id?: unknown;
    name?: unknown;
    price?: unknown;
    quantity_options?: Array<{ quantity?: unknown; price?: unknown }> | null;
  } | null;
  selected_options?: unknown;
};

export function resolveCartItemPricing(item: CheckoutCartItemLike): {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
} {
  const quantityNum = toNum(item?.quantity, 1);
  const safeQty = Number.isFinite(quantityNum) && quantityNum > 0 ? quantityNum : 1;

  const basePrice = toNum(item?.products?.price, 0);
  const opts = item?.products?.quantity_options;

  if (Array.isArray(opts) && opts.length) {
    const match = opts.find((opt) => toNum(opt?.quantity, NaN) === safeQty);
    const optPrice = match ? toNum(match?.price, NaN) : NaN;
    if (Number.isFinite(optPrice)) {
      const total = optPrice;
      const unit = total / safeQty;
      return { quantity: safeQty, unitPrice: unit, totalPrice: total };
    }
  }

  const total = basePrice * safeQty;
  return { quantity: safeQty, unitPrice: basePrice, totalPrice: total };
}

export function buildOrderItemsFromCheckout(checkoutData: CheckoutData): CreateOrderItemBody[] {
  const items = (checkoutData as any).cartItems as any[];
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const pricing = resolveCartItemPricing(item as CheckoutCartItemLike);

    return {
      product_id: String(item?.products?.id ?? ''),
      product_name: String(item?.products?.name ?? ''),
      quantity: pricing.quantity,
      price: money2(pricing.unitPrice),
      total: money2(pricing.totalPrice),
      options: item?.selected_options ?? null,
    };
  });
}

/* -------------------- checkout totals -------------------- */

export function getCheckoutTotal(checkoutData: CheckoutData): number {
  return toNum((checkoutData as any)?.total, 0);
}

/* -------------------- customer info -------------------- */

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

function unwrapProfile(p: unknown): Record<string, unknown> | null {
  if (!isPlainObject(p)) return null;
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
    authUser && typeof (authUser as any).email === 'string'
      ? toTrimStr((authUser as any).email)
      : '';

  const email =
    emailFromAuth || (p ? pickStr(p, ['email', 'mail', 'user_email', 'userEmail'], '') : '');

  const phone =
    (p ? pickStr(p, ['phone', 'phone_number', 'phoneNumber', 'mobile', 'mobile_phone'], '') : '') ||
    '';

  return {
    name: toTrimStr(name),
    email: toTrimStr(email),
    phone: toTrimStr(phone),
  };
}
