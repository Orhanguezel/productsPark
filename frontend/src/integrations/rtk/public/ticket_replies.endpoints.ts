// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/ticket_replies.endpoints.ts
// FINAL — Ticket Replies (PUBLIC) RTK
// - helpers/normalizers centralized in integrations/types/support.ts
// - no any
// - tagTypes: TicketReplies, SupportTickets
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type { TicketReply } from '@/integrations/types';
import { normalizeTicketReply, normalizeTicketReplyList } from '@/integrations/types';

const BASE='/ticket_replies';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['TicketReplies', 'SupportTickets'] as const,
});

export const ticketRepliesApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /ticket_replies/by-ticket/:ticketId */
    listTicketRepliesByTicket: b.query<TicketReply[], string>({
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

    /** POST /ticket_replies (kullanıcı veya admin; public route) */
    createTicketReply: b.mutation<
      TicketReply,
      { ticket_id: string; user_id?: string | null; message: string; is_admin?: boolean }
    >({
      query: (body): FetchArgs => ({
        url: BASE,
        method: 'POST',
        // BE uyumluluğu için hem snake hem camel gönder
        body: {
          ticket_id: body.ticket_id,
          ticketId: body.ticket_id,

          user_id: typeof body.user_id === 'undefined' ? null : body.user_id,
          userId: typeof body.user_id === 'undefined' ? null : body.user_id,

          message: body.message,

          ...(typeof body.is_admin === 'boolean'
            ? { is_admin: body.is_admin, isAdmin: body.is_admin }
            : {}),
        },
      }),
      transformResponse: (res: unknown): TicketReply => normalizeTicketReply(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'TicketReplies' as const, id: `TICKET_${arg.ticket_id}` },
        { type: 'SupportTickets' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useListTicketRepliesByTicketQuery, useCreateTicketReplyMutation } = ticketRepliesApi;
