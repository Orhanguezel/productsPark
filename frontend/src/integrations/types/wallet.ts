// =============================================================
// FILE: src/integrations/types/wallet.ts
// FINAL — Wallet types + helpers + normalizers + query mappers
// - strict/no-any
// - NO risky casts
// - central common: isObject/toStr/toNum + QueryParams
// =============================================================

import type { QueryParams } from '@/integrations/types';
import { isObject, toStr, toNum } from '@/integrations/types';

/* ----------------------------- domain types ----------------------------- */

export type WalletDepositStatus = 'pending' | 'approved' | 'rejected' | (string & {});

export interface WalletDepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_proof: string | null;
  status: WalletDepositStatus;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dokümantasyon amaçlı BE kontratı. Normalizer içinde direct cast YOK.
 */
export interface ApiWalletDepositRequest extends Omit<
  WalletDepositRequest,
  'amount' | 'payment_proof' | 'admin_notes' | 'processed_at'
> {
  amount: number | string;

  payment_proof?: string | null; // legacy/optional
  proof_image_url?: string | null; // preferred/legacy compatible

  admin_notes?: string | null; // preferred
  admin_note?: string | null; // legacy

  processed_at?: string | null;
}

export type WalletTxnType = 'deposit' | 'withdrawal' | 'purchase' | 'refund' | (string & {});

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: WalletTxnType;
  amount: number;
  description: string | null;
  order_id?: string | null;
  created_at: string;
}

/** Dokümantasyon amaçlı. Normalizer direct cast yapmaz. */
export interface ApiWalletTransaction extends Omit<WalletTransaction, 'amount' | 'description'> {
  amount: number | string;
  description?: string | null;
}

/** FE list param order format:
 * - "asc"/"desc" (shorthand)
 * - "created_at.asc" gibi full
 */
export type OrderParam = 'asc' | 'desc' | (string & {});

export interface ListDepositParams {
  user_id?: string;
  status?: WalletDepositStatus;
  limit?: number;
  offset?: number;
  order?: OrderParam;
}

export interface ListTxnParams {
  user_id?: string;
  limit?: number;
  offset?: number;
  order?: OrderParam;
}

export type QueryParamsStrict = QueryParams;

/* ----------------------------- helpers ----------------------------- */

type Obj = Record<string, unknown>;

const DEFAULT_PLUCK_KEYS = [
  'data',
  'items',
  'rows',
  'result',
  'requests',
  'wallet_deposit_requests',
  'transactions',
  'wallet_transactions',
] as const;

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

export const pluckWalletArray = (
  res: unknown,
  keys: readonly string[] = DEFAULT_PLUCK_KEYS,
): unknown[] => {
  if (Array.isArray(res)) return res;

  if (isObject(res)) {
    const obj = res as Obj;
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) return v;
    }
  }

  return [];
};

const normalizeOrder = (ord?: OrderParam): string | undefined => {
  if (!ord) return undefined;
  if (ord === 'asc' || ord === 'desc') return `created_at.${ord}`;
  return String(ord);
};

export const toWalletDepositListQuery = (p?: ListDepositParams | void): QueryParams | undefined => {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  const ord = normalizeOrder(p.order);
  if (ord) q.order = ord;

  return Object.keys(q).length ? q : undefined;
};

export const toWalletTxnListQuery = (p?: ListTxnParams | void): QueryParams | undefined => {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (p.user_id) q.user_id = p.user_id;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  const ord = normalizeOrder(p.order);
  if (ord) q.order = ord;

  return Object.keys(q).length ? q : undefined;
};

export const dropUserIdFromQuery = (qp?: QueryParams): QueryParams | undefined => {
  if (!qp) return undefined;
  const { user_id: _omit, ...rest } = qp as QueryParams & { user_id?: unknown };
  return Object.keys(rest).length ? rest : undefined;
};

/* ----------------------------- normalizers ----------------------------- */

export const normalizeWalletDepositRequest = (row: unknown): WalletDepositRequest => {
  const r: Obj = isObject(row) ? (row as Obj) : {};

  const id = pickTrimStr(r, ['id'], '');
  const user_id = pickTrimStr(r, ['user_id', 'userId'], '');

  const amount = toNum(pickFirst(r, ['amount']));

  const payment_method = pickTrimStr(r, ['payment_method', 'paymentMethod'], '');

  const status = (pickFirst(r, ['status']) ?? 'pending') as WalletDepositStatus;

  // FE: payment_proof; BE preferred: proof_image_url
  const payment_proof =
    pickOptTrimStr(r, ['proof_image_url', 'payment_proof', 'paymentProof']) ?? null;

  const admin_notes = pickOptTrimStr(r, ['admin_notes', 'admin_note', 'adminNotes']) ?? null;

  const processed_at = pickOptTrimStr(r, ['processed_at', 'processedAt']) ?? null;

  const created_at = pickTrimStr(r, ['created_at', 'createdAt'], '');
  const updated_at = pickTrimStr(r, ['updated_at', 'updatedAt'], created_at);

  return {
    id,
    user_id,
    amount,
    payment_method,
    status,
    payment_proof,
    admin_notes,
    processed_at,
    created_at,
    updated_at,
  };
};

export const normalizeWalletTransaction = (row: unknown): WalletTransaction => {
  const r: Obj = isObject(row) ? (row as Obj) : {};

  const id = pickTrimStr(r, ['id'], '');
  const user_id = pickTrimStr(r, ['user_id', 'userId'], '');

  const type = pickTrimStr(r, ['type'], '') as WalletTxnType;

  const amount = toNum(pickFirst(r, ['amount']));
  const description = pickOptTrimStr(r, ['description']) ?? null;

  const order_id = pickOptTrimStr(r, ['order_id', 'orderId']);

  const created_at = pickTrimStr(r, ['created_at', 'createdAt'], '');

  return {
    id,
    user_id,
    type,
    amount,
    description,
    ...(order_id ? { order_id } : {}),
    created_at,
  };
};

export const normalizeWalletDepositRequests = (res: unknown): WalletDepositRequest[] =>
  pluckWalletArray(res).map((x) => normalizeWalletDepositRequest(x));

export const normalizeWalletTransactions = (res: unknown): WalletTransaction[] =>
  pluckWalletArray(res).map((x) => normalizeWalletTransaction(x));

/**
 * Balance normalize:
 * - { balance }
 * - { data: { balance } }
 * - "12.34" / 12.34
 */

export const normalizeWalletBalance = (res: unknown): number => {
  // primitive
  if (typeof res === 'number' || typeof res === 'string') return toNum(res);

  if (!isObject(res)) return 0;

  const o = res as Obj;

  const directKeys = ['balance', 'wallet_balance', 'walletBalance', 'value', 'amount'] as const;
  const nestedKeys = ['data', 'result', 'item', 'payload'] as const;

  // 1) root direct keys
  for (const k of directKeys) {
    if (o[k] != null) return toNum(o[k]);
  }

  // 2) one-level nested wrappers
  for (const nk of nestedKeys) {
    const inner = o[nk];
    if (isObject(inner)) {
      const d = inner as Obj;
      for (const k of directKeys) {
        if (d[k] != null) return toNum(d[k]);
      }

      // 3) two-level nested (çok görülen: { data: { data: { balance } } })
      const inner2 = d['data'];
      if (isObject(inner2)) {
        const dd = inner2 as Obj;
        for (const k of directKeys) {
          if (dd[k] != null) return toNum(dd[k]);
        }
      }
    }
  }

  return 0;
};



/**
 * adjustUserWallet response:
 * BE: { ok, balance, transaction }
 */
export type AdjustWalletResp = { ok: boolean; balance: number; transaction: WalletTransaction };

export const normalizeAdjustWalletResp = (res: unknown): AdjustWalletResp => {
  const r: Obj = isObject(res) ? (res as Obj) : {};
  const ok = Boolean(r['ok']);
  const balance = normalizeWalletBalance(r['balance']);
  const transaction = normalizeWalletTransaction(r['transaction']);
  return { ok, balance, transaction };
};
