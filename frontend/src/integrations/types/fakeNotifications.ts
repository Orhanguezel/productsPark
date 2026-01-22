// =============================================================
// FILE: src/integrations/types/fakeNotifications.ts
// FINAL — Fake Notifications types + helpers + normalizers + query mappers
// - strict/no-any
// - central common: isObject/toStr/toNum/toBool + QueryParams
// =============================================================

import type { BoolLike, QueryParams } from '@/integrations/types';
import { isObject, toStr, toNum, toBool } from '@/integrations/types';

/* ----------------------------- domain types ----------------------------- */

export type FakeOrderNotification = {
  id: string;
  product_name: string;
  customer: string;
  location: string | null;
  time_ago: string;
  is_active: boolean;
  created_at: string;
};

export type FakeNotificationSettings = {
  notification_display_duration: number;
  notification_interval: number;
  notification_delay: number;
  fake_notifications_enabled: boolean;
};

/* ----------------------------- params ----------------------------- */

export type FakeOrdersAdminListParams = Partial<{
  is_active: boolean;
  q: string;
  order: string; // "created_at.desc"
  limit: number;
  offset: number;
}>;

export const toFakeOrdersAdminListQuery = (
  p?: FakeOrdersAdminListParams | void,
): QueryParams | undefined => {
  if (!p) return undefined;

  const q: QueryParams = {};
  if (typeof p.is_active === 'boolean') q.is_active = p.is_active ? 1 : 0;
  if (p.q) q.q = p.q;
  if (p.order) q.order = p.order;
  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  return Object.keys(q).length ? q : undefined;
};

/* ----------------------------- helpers ----------------------------- */

type Obj = Record<string, unknown>;

const DEFAULT_PLUCK_KEYS = [
  'data',
  'items',
  'rows',
  'result',
  'fake_orders',
  'fakeOrders',
] as const;

export const pluckFakeArray = (
  res: unknown,
  keys: readonly string[] = DEFAULT_PLUCK_KEYS,
): unknown[] => {
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

/**
 * unknown -> BoolLike daraltma (common.ts BoolLike ile %100 uyumlu)
 * - object/array gibi tipler -> undefined (fallback'e düşsün)
 */
const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v;
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
    return undefined;
  }

  // number ama 0/1 değilse: BoolLike değil
  if (typeof v === 'number') return undefined;

  // object/array/function vs => BoolLike değil
  return undefined;
};

/* ----------------------------- normalizers ----------------------------- */

export const normalizeFakeOrderNotification = (row: unknown): FakeOrderNotification => {
  const r: Obj = isObject(row) ? (row as Obj) : {};

  const isActiveRaw = pickFirst(r, ['is_active', 'isActive']);

  return {
    id: pickTrimStr(r, ['id'], ''),
    product_name: pickTrimStr(r, ['product_name', 'productName'], ''),
    customer: pickTrimStr(r, ['customer'], ''),
    location: pickOptTrimStr(r, ['location']),
    time_ago: pickTrimStr(r, ['time_ago', 'timeAgo'], ''),
    is_active: toBool(asBoolLike(isActiveRaw), false),
    created_at: pickTrimStr(r, ['created_at', 'createdAt'], ''),
  };
};

export const normalizeFakeOrderNotifications = (res: unknown): FakeOrderNotification[] =>
  pluckFakeArray(res, ['data', 'items', 'rows', 'result', 'fake_orders', 'fakeOrders']).map((x) =>
    normalizeFakeOrderNotification(x),
  );

export const normalizeFakeNotificationSettings = (row: unknown): FakeNotificationSettings => {
  const r: Obj = isObject(row) ? (row as Obj) : {};

  const display = toNum(pickFirst(r, ['notification_display_duration']), 5);
  const interval = toNum(pickFirst(r, ['notification_interval']), 30);
  const delay = toNum(pickFirst(r, ['notification_delay']), 10);

  // varsayılan enabled: true (BE boş dönerse)
  const enabledRaw = pickFirst(r, ['fake_notifications_enabled', 'fakeNotificationsEnabled']);
  const enabled = typeof enabledRaw === 'undefined' ? true : toBool(asBoolLike(enabledRaw), true);

  return {
    notification_display_duration: display,
    notification_interval: interval,
    notification_delay: delay,
    fake_notifications_enabled: enabled,
  };
};
