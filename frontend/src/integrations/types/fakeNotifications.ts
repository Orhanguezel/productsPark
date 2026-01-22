// =============================================================
// FILE: src/integrations/types/fakeNotifications.ts
// FINAL — robust response shapes (deep pluck + site-setting wrapper parse)
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

const asBoolLike = (v: unknown): BoolLike => {
  if (v === null || typeof v === 'undefined') return v;
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
    return undefined;
  }

  if (typeof v === 'number') return undefined;
  return undefined;
};

/**
 * Deep pluck:
 * - supports res = array
 * - supports {data:[...]} etc
 * - supports {data:{items:[...]}} etc
 */
const pluckArrayDeep = (
  res: unknown,
  containers: readonly string[],
  arrays: readonly string[],
): unknown[] => {
  if (Array.isArray(res)) return res;
  if (!isObject(res)) return [];

  const o = res as Obj;

  // 1) try direct arrays on root
  for (const k of arrays) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }

  // 2) try container objects on root then arrays inside them
  for (const c of containers) {
    const cv = o[c];
    if (Array.isArray(cv)) return cv;
    if (isObject(cv)) {
      const co = cv as Obj;
      for (const k of arrays) {
        const v = co[k];
        if (Array.isArray(v)) return v;
      }
    }
  }

  return [];
};

export const pluckFakeArray = (
  res: unknown,
  keys: readonly string[] = ['data', 'result'],
): unknown[] => {
  // “keys” burada container’lar gibi düşünülebilir (data/result)
  // array keys seti:
  const arrayKeys = ['items', 'rows', 'data', 'result', 'fake_orders', 'fakeOrders'] as const;
  return pluckArrayDeep(res, keys, arrayKeys);
};

/**
 * Site-setting wrapper’ı çöz:
 * - direct config object olabilir
 * - { value: {...} } olabilir
 * - { value: "json-string" } olabilir
 * - { data: { value: ... } } olabilir
 */
const unwrapSiteSettingValue = (input: unknown): unknown => {
  if (!isObject(input)) return input;
  const o = input as Obj;

  const directValue = pickFirst(o, ['value']);
  if (typeof directValue !== 'undefined') return directValue;

  const data = o['data'];
  if (isObject(data)) {
    const dv = pickFirst(data as Obj, ['value']);
    if (typeof dv !== 'undefined') return dv;
    return data;
  }

  return input;
};

const tryParseJson = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!s) return v;
  // hızlı guard: JSON olma ihtimali
  if (!(s.startsWith('{') || s.startsWith('['))) return v;

  try {
    return JSON.parse(s) as unknown;
  } catch {
    return v;
  }
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
  pluckFakeArray(res, ['data', 'result']).map((x) => normalizeFakeOrderNotification(x));

export const normalizeFakeNotificationSettings = (row: unknown): FakeNotificationSettings => {
  // unwrap: {value: ...} / {data:{value}} / direct
  const raw = tryParseJson(unwrapSiteSettingValue(row));
  const r: Obj = isObject(raw) ? (raw as Obj) : {};

  const display = toNum(pickFirst(r, ['notification_display_duration']), 5);
  const interval = toNum(pickFirst(r, ['notification_interval']), 30);
  const delay = toNum(pickFirst(r, ['notification_delay']), 10);

  const enabledRaw = pickFirst(r, ['fake_notifications_enabled', 'fakeNotificationsEnabled']);
  const enabled = typeof enabledRaw === 'undefined' ? true : toBool(asBoolLike(enabledRaw), true);

  return {
    notification_display_duration: display,
    notification_interval: interval,
    notification_delay: delay,
    fake_notifications_enabled: enabled,
  };
};
