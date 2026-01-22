// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/ticket_replies_admin.endpoints.ts
// FINAL — Ticket Replies (ADMIN) RTK (no helpers here)
// - tagTypes: TicketReplies, SupportTickets
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { TicketReply, AdminCreateTicketReplyBody } from '@/integrations/types';
import {
  normalizeTicketReply,
  normalizeTicketReplyList,
  toAdminCreateTicketReplyBody,
} from '@/integrations/types';

const BASE='admin/ticket_replies';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['TicketReplies', 'SupportTickets'] as const,
});

export const ticketRepliesAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/ticket_replies/by-ticket/:ticketId */
    listTicketRepliesAdmin: b.query<TicketReply[], string>({
      query: (ticketId): FetchArgs => ({
        url: `${BASE}/by-ticket/${encodeURIComponent(ticketId)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): TicketReply[] => normalizeTicketReplyList(res),
      providesTags: (_r, _e, ticketId) => [
        { type: 'TicketReplies' as const, id: `TICKET_${ticketId}` },
      ],
      keepUnusedDataFor: 60,
    }),

    /** POST /admin/ticket_replies */
    createTicketReplyAdmin: b.mutation<TicketReply, AdminCreateTicketReplyBody>({
      query: (body): FetchArgs => ({
        url: BASE,
        method: 'POST',
        body: toAdminCreateTicketReplyBody(body),
      }),
      transformResponse: (res: unknown): TicketReply => normalizeTicketReply(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'TicketReplies' as const, id: `TICKET_${arg.ticket_id}` },
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /admin/ticket_replies/:id */
    deleteTicketReplyAdmin: b.mutation<{ ok: true }, { id: string; ticket_id?: string }>({
      query: ({ id }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        ...(arg.ticket_id
          ? [{ type: 'TicketReplies' as const, id: `TICKET_${arg.ticket_id}` }]
          : []),
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
  useDeleteTicketReplyAdminMutation,
} = ticketRepliesAdminApi;
