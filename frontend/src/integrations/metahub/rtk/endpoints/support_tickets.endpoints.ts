

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/support_tickets.endpoints.ts
// =============================================================
import { baseApi as baseApi5 } from "../baseApi";

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  priority?: "low" | "normal" | "high";
  created_at: string;
  updated_at?: string;
};

export const supportTicketsApi = baseApi5.injectEndpoints({
  endpoints: (b) => ({
    listSupportTickets: b.query<SupportTicket[], { user_id?: string; status?: SupportTicket["status"]; limit?: number; offset?: number }>({
      query: (params) => ({ url: "/support_tickets", params }),
      transformResponse: (res: unknown): SupportTicket[] => Array.isArray(res) ? (res as SupportTicket[]) : [],
      providesTags: (result) => result
        ? [...result.map((t) => ({ type: "SupportTicket" as const, id: t.id })), { type: "SupportTickets" as const, id: "LIST" }]
        : [{ type: "SupportTickets" as const, id: "LIST" }],
    }),

    getSupportTicketById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `/support_tickets/${id}` }),
      transformResponse: (res: unknown): SupportTicket => res as SupportTicket,
      providesTags: (_r, _e, id) => [{ type: "SupportTicket", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListSupportTicketsQuery, useGetSupportTicketByIdQuery } = supportTicketsApi;
