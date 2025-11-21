// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/ticket_replies.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { ApiTicketReply, TicketReply } from "../types/support";

const isTrue = (v: unknown) =>
  v === true || v === 1 || v === "1" || v === "true";

const normalizeReply = (r: ApiTicketReply): TicketReply => ({
  id: String(r.id),
  ticket_id: String(r.ticket_id ?? r.ticketId ?? ""),
  user_id: (r.user_id ?? r.userId ?? null) as string | null,
  message: String(r.message ?? ""),
  is_admin: isTrue(r.is_admin ?? r.isAdmin),
  created_at: String(r.created_at ?? r.createdAt ?? ""),
});

export const ticketRepliesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTicketRepliesByTicket: b.query<TicketReply[], string>({
      query: (ticketId) => ({ url: `/ticket_replies/by-ticket/${ticketId}` }),
      transformResponse: (res: unknown): TicketReply[] =>
        Array.isArray(res)
          ? (res as ApiTicketReply[]).map(normalizeReply)
          : [],
      providesTags: (_r, _e, ticketId) => [
        { type: "TicketReplies", id: `TICKET_${ticketId}` },
      ],
    }),

    /** Yeni yanıt oluştur (kullanıcı veya admin) */
    createTicketReply: b.mutation<
      TicketReply,
      {
        ticket_id: string;
        user_id?: string | null;
        message: string;
        is_admin?: boolean;
      }
    >({
      query: (body) => ({
        url: `/ticket_replies`,
        method: "POST",
        /** BE uyumluluğu için hem snake hem camel gönder */
        body: {
          ticket_id: body.ticket_id,
          ticketId: body.ticket_id,
          user_id: body.user_id ?? null,
          userId: body.user_id ?? null,
          message: body.message,
          ...(typeof body.is_admin === "boolean"
            ? { is_admin: body.is_admin, isAdmin: body.is_admin }
            : {}),
        },
      }),
      transformResponse: (res: unknown): TicketReply =>
        normalizeReply(res as ApiTicketReply),
      invalidatesTags: (_r, _e, arg) => [
        { type: "TicketReplies", id: `TICKET_${arg.ticket_id}` },
        { type: "SupportTickets", id: "LIST" }, // 👈 public ticket listesi de yenilensin
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTicketRepliesByTicketQuery,
  useCreateTicketReplyMutation,
} = ticketRepliesApi;
