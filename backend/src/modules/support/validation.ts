// src/modules/support/validation.ts
import { z } from "zod";

export const SupportTicketStatus = z.enum(["open", "in_progress", "waiting_response", "closed"]);
export const SupportTicketPriority = z.enum(["low", "medium", "high", "urgent"]);

export const listTicketsQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: SupportTicketStatus.optional(),
  priority: SupportTicketPriority.optional(),
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createTicketBodySchema = z.object({
  user_id: z.string().uuid(),
  subject: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1).max(2000),
  priority: SupportTicketPriority.default("medium").optional(),
  // DB’de yok; gelirse yok sayacağız:
  category: z.string().trim().max(40).optional().nullable(),
});

export const updateTicketBodySchema = z.object({
  subject: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().min(1).max(2000).optional(),
  status: SupportTicketStatus.optional(),
  priority: SupportTicketPriority.optional(),
  category: z.string().trim().max(40).optional().nullable(), // yok sayılacak
}).refine((v) => Object.keys(v).length > 0, { message: "Boş patch gönderilemez." });

export const createReplyBodySchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  is_admin: z.boolean().optional(), // non-admin için zorla false
});
