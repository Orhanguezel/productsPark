

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/ticket_replies.endpoints.ts
// =============================================================
import { baseApi as baseApi6 } from "../baseApi";

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  message: string;
  created_at: string;
};

export const ticketRepliesApi = baseApi6.injectEndpoints({
  endpoints: (b) => ({
    listTicketRepliesByTicket: b.query<TicketReply[], string>({
      query: (ticketId) => ({ url: `/ticket_replies/by-ticket/${ticketId}` }),
      transformResponse: (res: unknown): TicketReply[] => Array.isArray(res) ? (res as TicketReply[]) : [],
      providesTags: (_r, _e, ticketId) => [{ type: "TicketReplies", id: `TICKET_${ticketId}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListTicketRepliesByTicketQuery } = ticketRepliesApi;