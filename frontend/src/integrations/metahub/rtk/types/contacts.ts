// ============================================================================
// FILE: src/integrations/metahub/db/types/contacts.ts
// ============================================================================

/** Durum alanı (BE: 'new' | 'in_progress' | 'closed') */
export type ContactStatus = "new" | "in_progress" | "closed";

/** Liste sıralama alanları */
export type ContactOrderBy = "created_at" | "updated_at" | "status" | "name";
/** Sıralama yönü */
export type SortOrder = "asc" | "desc";

/** BE'den dönen tam kayıt (admin/public GET sonrası görünüm) */
export interface ContactView {
  id: string;

  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;

  status: ContactStatus;
  is_resolved: boolean;
  admin_note: string | null;

  // meta
  ip: string | null;
  user_agent: string | null;

  // antispam (honeypot)
  website: string | null;

  // tarih alanları (DATETIME(3) -> string)
  created_at: string;
  updated_at: string;
}

/** Public create isteği (BE: ContactCreateSchema) */
export interface ContactCreateInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot – opsiyonel (string veya null) */
  website?: string | null;
}

/** Admin patch isteği (BE: ContactUpdateSchema) */
export interface ContactUpdateInput {
  status?: ContactStatus;
  is_resolved?: boolean;
  admin_note?: string | null;
}

/** Admin liste parametreleri (BE: ContactListParamsSchema) */
export interface ContactListParams {
  search?: string;
  status?: ContactStatus;
  resolved?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: ContactOrderBy;
  order?: SortOrder;
}

/** Public create dönüşü */
export type CreateContactPublicResponse = { ok: true; id: string };
