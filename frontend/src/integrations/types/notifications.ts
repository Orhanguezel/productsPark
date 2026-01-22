// ===================================================================
// FILE: src/integrations/types/notifications.ts
// FINAL — Notifications types + helpers + normalizers + mappers
// - no-explicit-any
// - exactOptionalPropertyTypes friendly
// Auth-required routes:
// - GET    /notifications
// - GET    /notifications/unread-count
// - POST   /notifications
// - PATCH  /notifications/:id
// - POST   /notifications/mark-all-read
// - DELETE /notifications/:id
// ===================================================================

/* ----------------------------- primitives ----------------------------- */

import type { BoolLike, QueryParams } from '@/integrations/types';
import { toBool } from '@/integrations/types';

const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
};



const toNum = (v: unknown, fallback = 0): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

function extractArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isObject(res)) {
    for (const k of ['items', 'data', 'rows', 'result'] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v as unknown[];
    }
  }
  return [];
}

/* ----------------------------- domain types ----------------------------- */

export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_failed'
  | 'booking_created'
  | 'booking_status_changed'
  | 'system'
  | 'custom'
  | (string & {});

export type NotificationView = {
  id: string;
  user_id: string;

  title: string;
  message: string;

  type: NotificationType;

  is_read: boolean;

  created_at: string;
};

export type NotificationsListParams = {
  is_read?: BoolLike;
  type?: string;

  limit?: number;
  offset?: number;
};

export type UnreadCountResp = { count: number };

export type CreateNotificationBody = {
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
};

export type UpdateNotificationBody = {
  is_read?: boolean;
};

export type MarkAllReadBody = Record<string, never>;
export type OkResp = { ok: true };

/* ----------------------------- API raw shapes ----------------------------- */

export type ApiNotificationRow = Partial<{
  id: unknown;
  user_id: unknown;
  userId: unknown;

  title: unknown;
  message: unknown;

  type: unknown;

  is_read: unknown;
  isRead: unknown;
  read: unknown;

  created_at: unknown;
  createdAt: unknown;
}>;

/** list response bazen object dönebilir: {items, unread_count} */
type ApiNotificationsListEnvelope = Partial<{
  items: unknown;
  unread_count: unknown;
  unreadCount: unknown;
  count: unknown;
}>;

type ApiUnreadCount = number | Partial<{ unread: unknown; count: unknown; total: unknown }>;

/* ----------------------------- normalizers ----------------------------- */

export function normalizeNotification(row: unknown): NotificationView {
  const r = (isObject(row) ? row : {}) as Record<string, unknown>;

  const id = toStr(r.id).trim();

  const user_id =
    (typeof r.user_id === 'string' ? r.user_id : '').trim() ||
    (typeof r.userId === 'string' ? r.userId : '').trim();

  const title = typeof r.title === 'string' ? r.title : toStr(r.title);
  const message = typeof r.message === 'string' ? r.message : toStr(r.message);

  const type = (typeof r.type === 'string' ? r.type : toStr(r.type)) as NotificationType;

  // unknown -> BoolLike daraltma (yalın ve tip-safe)
  const readRaw = r.is_read ?? r.isRead ?? r.read;
  const readLike: BoolLike =
    readRaw === true ||
    readRaw === false ||
    readRaw === 0 ||
    readRaw === 1 ||
    readRaw === '0' ||
    readRaw === '1' ||
    readRaw === 'true' ||
    readRaw === 'false' ||
    readRaw == null
      ? (readRaw as BoolLike)
      : undefined;

  const is_read = toBool(readLike, false);

  const created_at =
    (typeof r.created_at === 'string' ? r.created_at : '').trim() ||
    (typeof r.createdAt === 'string' ? r.createdAt : '').trim();

  return {
    id,
    user_id,
    title,
    message,
    type,
    is_read,
    created_at,
  };
}

export function normalizeNotificationsList(res: unknown): NotificationView[] {
  if (Array.isArray(res)) return res.map((x) => normalizeNotification(x));

  if (isObject(res)) {
    const env = res as ApiNotificationsListEnvelope;
    const items = extractArray(env.items);
    return items.map((x) => normalizeNotification(x));
  }

  return [];
}

export function normalizeUnreadCount(res: unknown): number {
  if (typeof res === 'number') return Number.isFinite(res) ? res : 0;

  const r = (res ?? {}) as ApiUnreadCount;

  if (isObject(r)) {
    const rr = r as Record<string, unknown>;
    const n = toNum(rr.count) || toNum(rr.unread) || toNum(rr.total);
    return n;
  }

  return 0;
}

export function normalizeOk(resp: unknown): OkResp {
  const r = (resp ?? {}) as Record<string, unknown>;
  const ok = r.ok;
  if (ok === true || ok === 1 || ok === '1' || ok === 'true') return { ok: true as const };
  return { ok: true as const };
}

/** mark-all-read: {updated:number} veya boş */
export type MarkAllReadResult = { updated: number };

export function normalizeMarkAllRead(res: unknown): MarkAllReadResult {
  if (isObject(res) && typeof res.updated !== 'undefined') {
    return { updated: toNum(res.updated, 0) };
  }
  return { updated: 0 };
}

/* ----------------------------- mappers ----------------------------- */

export function toNotificationsListQuery(p: NotificationsListParams = {}): QueryParams | undefined {
  const out: QueryParams = {};

  if (typeof p.is_read !== 'undefined') out.is_read = toBool(p.is_read) ? '1' : '0';
  if (p.type) out.type = p.type;

  if (typeof p.limit === 'number') out.limit = p.limit;
  if (typeof p.offset === 'number') out.offset = p.offset;

  return Object.keys(out).length ? out : undefined;
}

export function toCreateNotificationBody(b: CreateNotificationBody): Record<string, unknown> {
  return {
    ...(b.user_id ? { user_id: b.user_id } : {}),
    title: b.title,
    message: b.message,
    type: b.type,
  };
}

export function toUpdateNotificationBody(b: UpdateNotificationBody): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof b.is_read !== 'undefined') out.is_read = b.is_read;
  return out;
}
