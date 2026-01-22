// =============================================================
// FILE: src/integrations/types/contacts.ts
// FINAL — Contacts types + helpers (central types barrel)
// =============================================================

import { SortOrder } from '@/integrations/types';

export type ContactStatus = 'new' | 'in_progress' | 'closed';

export type ContactOrderBy = 'created_at' | 'updated_at' | 'status' | 'name';


export type ContactView = {
  id: string;

  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;

  status: ContactStatus;
  is_resolved: boolean;
  admin_note: string | null;

  ip: string | null;
  user_agent: string | null;

  website: string | null;

  created_at: string;
  updated_at: string;
};

export type ContactCreateInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website?: string | null; // honeypot
};

export type ContactUpdateInput = {
  status?: ContactStatus;
  is_resolved?: boolean;
  admin_note?: string | null;
};

export type ContactListParams = {
  search?: string;
  status?: ContactStatus;
  resolved?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: ContactOrderBy;
  order?: SortOrder;
};

export type CreateContactPublicResponse = { ok: true; id: string };

/* -------------------- helpers -------------------- */

/**
 * Admin list query string builder
 * Backend expects: search, status, resolved, limit, offset, orderBy, order
 * - undefined değerleri koymaz
 */
export function buildContactsAdminListQuery(p?: ContactListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (p.search) sp.set('search', p.search);
  if (p.status) sp.set('status', p.status);
  if (typeof p.resolved === 'boolean') sp.set('resolved', p.resolved ? '1' : '0');
  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));
  if (p.orderBy) sp.set('orderBy', p.orderBy);
  if (p.order) sp.set('order', p.order);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
