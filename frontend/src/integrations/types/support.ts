// =============================================================
// FILE: src/integrations/types/support.ts
// FINAL — Support types + normalizers + query/body mappers
// - strict/no-any
// - tolerant (snake/camel; [] or {data/items/rows/result/...})
// - exactOptionalPropertyTypes friendly (undefined set edilmez)
// =============================================================

import type { QueryParams } from '@/integrations/types';
import { toStr, extractArray } from '@/integrations/types';

/* ----------------------------- primitives ----------------------------- */

type UnknownRecord = Record<string, unknown>;

const isObject = (x: unknown): x is UnknownRecord =>
  !!x && typeof x === 'object' && !Array.isArray(x);


const trim = (v: unknown): string => toStr(v).trim();

const pickFirst = (src: UnknownRecord, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

const pickStr = (src: UnknownRecord, keys: readonly string[], fallback = ''): string => {
  const s = trim(pickFirst(src, keys));
  return s ? s : fallback;
};

const pickOptStr = (src: UnknownRecord, keys: readonly string[]): string | null => {
  const s = trim(pickFirst(src, keys));
  return s ? s : null;
};

const toBoolLoose = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on', 'active', 'enabled'].includes(s)) return true;
    if (['0', 'false', 'no', 'n', 'off', 'inactive', 'disabled'].includes(s)) return false;
  }
  if (v == null) return fallback;
  return fallback;
};



/* ----------------------------- domain types ----------------------------- */

export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'closed';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Backend’ten gelebilecek ham ticket (snake/camel tolerant) */
export type ApiSupportTicket = Partial<{
  id: unknown;

  user_id: unknown;
  userId: unknown;

  subject: unknown;
  message: unknown;

  status: unknown;
  priority: unknown;
  category: unknown;

  created_at: unknown;
  createdAt: unknown;
  updated_at: unknown;
  updatedAt: unknown;
}>;

export type SupportTicket = {
  id: string;
  user_id: string;

  subject: string;
  message: string;

  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string | null;

  created_at: string;
  updated_at: string;
};

/** Ticket reply (thread) raw */
export type ApiTicketReply = Partial<{
  id: unknown;

  ticket_id: unknown;
  ticketId: unknown;

  user_id: unknown;
  userId: unknown;

  message: unknown;

  is_admin: unknown;
  isAdmin: unknown;

  created_at: unknown;
  createdAt: unknown;
}>;

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};

/* ----------------------------- list/update/create types ----------------------------- */

export type SupportListParams = {
  user_id?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  q?: string;

  limit?: number;
  offset?: number;

  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
};

export type SupportCreateBody = {
  user_id: string;
  subject: string;
  message: string;
  priority?: SupportTicketPriority;
  category?: string | null;
};

export type SupportUpdatePatch = Partial<
  Pick<SupportTicket, 'status' | 'priority' | 'subject' | 'message' | 'category'>
>;

/** Admin reply create body (RTK endpoint kullanır) */
export type AdminCreateTicketReplyBody = {
  ticket_id: string;
  user_id?: string | null;
  message: string;
};

/* ----------------------------- normalizers ----------------------------- */

export function normalizeSupportStatus(raw: unknown): SupportTicketStatus {
  const s = trim(raw).toLowerCase();

  if (s === 'open') return 'open';
  if (s === 'in_progress') return 'in_progress';
  if (s === 'waiting_response') return 'waiting_response';
  if (s === 'closed') return 'closed';

  // legacy fallbacks
  if (s === 'answered') return 'waiting_response';
  if (s === 'resolved') return 'closed';

  return 'open';
}

export function normalizeSupportPriority(raw: unknown): SupportTicketPriority {
  const p = trim(raw).toLowerCase();
  if (p === 'low' || p === 'medium' || p === 'high' || p === 'urgent') return p;
  return 'medium';
}

export function normalizeSupportTicket(row: unknown): SupportTicket {
  const r = isObject(row) ? row : ({} as UnknownRecord);

  const createdAt = pickStr(r, ['created_at', 'createdAt'], '');
  const updatedAt = pickStr(r, ['updated_at', 'updatedAt'], createdAt);

  return {
    id: pickStr(r, ['id'], ''),
    user_id: pickStr(r, ['user_id', 'userId'], ''),

    subject: pickStr(r, ['subject'], ''),
    message: pickStr(r, ['message'], ''),

    status: normalizeSupportStatus(pickFirst(r, ['status'])),
    priority: normalizeSupportPriority(pickFirst(r, ['priority'])),
    category: pickOptStr(r, ['category']) ?? null,

    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export function normalizeSupportTicketList(res: unknown): SupportTicket[] {
  return extractArray(res, ['data', 'items', 'rows', 'result', 'tickets']).map((x) =>
    normalizeSupportTicket(x),
  );
}

/** Reply normalize (snake/camel tolerant) */
export function normalizeTicketReply(row: unknown): TicketReply {
  const r = isObject(row) ? row : ({} as UnknownRecord);

  return {
    id: pickStr(r, ['id'], ''),
    ticket_id: pickStr(r, ['ticket_id', 'ticketId'], ''),
    user_id: pickOptStr(r, ['user_id', 'userId']),
    message: pickStr(r, ['message'], ''),
    is_admin: toBoolLoose(pickFirst(r, ['is_admin', 'isAdmin']), false),
    created_at: pickStr(r, ['created_at', 'createdAt'], ''),
  };
}

export function normalizeTicketReplyList(res: unknown): TicketReply[] {
  return extractArray(res, ['data', 'items', 'rows', 'result', 'replies', 'ticket_replies']).map(
    (x) => normalizeTicketReply(x),
  );
}

/* ----------------------------- query/body mappers ----------------------------- */

const clamp = (n: number, min = 1, max = 200) => Math.max(min, Math.min(max, n));

export function toSupportListQuery(p?: SupportListParams | void): QueryParams | undefined {
  if (!p) return undefined;

  const q: QueryParams = {};

  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status;
  if (p.priority) q.priority = p.priority;
  if (p.q) q.q = p.q;

  if (typeof p.limit === 'number') q.limit = clamp(Number(p.limit), 1, 200);
  if (typeof p.offset === 'number') q.offset = Math.max(0, Number(p.offset));

  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;

  return Object.keys(q).length ? q : undefined;
}

/** Create body mapper (undefined basmaz) */
export function toSupportCreateBody(b: SupportCreateBody): Record<string, unknown> {
  const out: Record<string, unknown> = {
    user_id: b.user_id,
    userId: b.user_id, // legacy compat
    subject: b.subject,
    message: b.message,
    priority: b.priority ?? 'medium',
  };

  if (typeof b.category !== 'undefined') out.category = b.category;

  return out;
}

export function toSupportUpdateBody(patch: SupportUpdatePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (typeof patch.status !== 'undefined') out.status = patch.status;
  if (typeof patch.priority !== 'undefined') out.priority = patch.priority;
  if (typeof patch.subject !== 'undefined') out.subject = patch.subject;
  if (typeof patch.message !== 'undefined') out.message = patch.message;
  if (typeof patch.category !== 'undefined') out.category = patch.category;

  return out;
}

/** Ticket reply create body mapper (admin) */
export function toAdminCreateTicketReplyBody(
  b: AdminCreateTicketReplyBody,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ticket_id: b.ticket_id,
    message: b.message,
  };

  // user_id opsiyonel; undefined basmayalım
  if (typeof b.user_id !== 'undefined') out.user_id = b.user_id;

  return out;
}
