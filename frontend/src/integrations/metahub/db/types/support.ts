// =============================================================
// FILE: src/integrations/metahub/db/types/support.ts
// =============================================================
export type UnknownRow = Record<string, unknown>;

/** Admin ile uyumlu ticket durumları */
export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_response"
  | "closed";

/** Öncelik tipleri */
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

/** Backend’ten gelebilecek "view" satırı (camel/snake olası) */
export type ApiSupportTicket = Partial<{
  id: string;
  user_id: string;
  userId: string;

  subject: string;
  message: string;

  status: string;   // normalize edeceğiz
  priority: string; // normalize edeceğiz
  category: string | null;

  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}>;

/** FE’nin normalized tipi */
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


export type SupportTicketView = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "waiting_response" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketReplyView = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};

/** Hem snake hem camel destekle */
export type ApiTicketReply = {
  id?: unknown;
  ticket_id?: unknown; ticketId?: unknown;
  user_id?: unknown; userId?: unknown;
  message?: unknown;
  is_admin?: unknown; isAdmin?: unknown;
  created_at?: unknown; createdAt?: unknown;
};
