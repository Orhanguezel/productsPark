import { store as store5 } from "@/store";
import { normalizeError as normalizeError5 } from "@/integrations/metahub/core/errors";
import {
  supportTicketsApi,
  type SupportTicket,
  type SupportTicketStatus,
  type SupportTicketPriority,
} from "@/integrations/metahub/rtk/endpoints/support_tickets.endpoints";
import {
  ticketRepliesApi,
  type TicketReply,
} from "@/integrations/metahub/rtk/endpoints/ticket_replies.endpoints";

export type { SupportTicket, SupportTicketStatus, SupportTicketPriority, TicketReply };

export const support_tickets = {
  async listTickets(params?: Parameters<typeof supportTicketsApi.endpoints.listSupportTickets.initiate>[0]) {
    try {
      const data = await store5.dispatch(supportTicketsApi.endpoints.listSupportTickets.initiate(params ?? {})).unwrap();
      return { data: data as SupportTicket[], error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as SupportTicket[] | null, error: { message } };
    }
  },

  async getTicketById(id: string) {
    try {
      const data = await store5.dispatch(supportTicketsApi.endpoints.getSupportTicketById.initiate(id)).unwrap();
      return { data: data as SupportTicket, error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as SupportTicket | null, error: { message } };
    }
  },

  async createTicket(body: { user_id: string; subject: string; message: string; priority?: SupportTicketPriority; category?: string | null }) {
    try {
      const data = await store5.dispatch(supportTicketsApi.endpoints.createSupportTicket.initiate(body)).unwrap();
      return { data: data as SupportTicket, error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as SupportTicket | null, error: { message } };
    }
  },

  async updateTicket(id: string, patch: Partial<Pick<SupportTicket, "status" | "priority" | "subject" | "message" | "category">>) {
    try {
      const data = await store5.dispatch(supportTicketsApi.endpoints.updateSupportTicket.initiate({ id, patch })).unwrap();
      return { data: data as SupportTicket, error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as SupportTicket | null, error: { message } };
    }
  },

  async listReplies(ticketId: string) {
    try {
      const data = await store5.dispatch(ticketRepliesApi.endpoints.listTicketRepliesByTicket.initiate(ticketId)).unwrap();
      return { data: data as TicketReply[], error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as TicketReply[] | null, error: { message } };
    }
  },

  async createReply(body: { ticket_id: string; user_id?: string | null; message: string; is_admin?: boolean }) {
    try {
      const data = await store5.dispatch(ticketRepliesApi.endpoints.createTicketReply.initiate(body)).unwrap();
      return { data: data as TicketReply, error: null as null };
    } catch (e) {
      const { message } = normalizeError5(e);
      return { data: null as TicketReply | null, error: { message } };
    }
  },
};
