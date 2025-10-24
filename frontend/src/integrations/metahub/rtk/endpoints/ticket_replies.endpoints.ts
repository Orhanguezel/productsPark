import { baseApi as baseApi6 } from "../baseApi";

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};

const isTrue = (v: unknown) =>
  v === true || v === 1 || v === "1" || v === "true";

/** Hem snake hem camel destekle */
type ApiTicketReply = {
  id?: unknown;
  ticket_id?: unknown; ticketId?: unknown;
  user_id?: unknown; userId?: unknown;
  message?: unknown;
  is_admin?: unknown; isAdmin?: unknown;
  created_at?: unknown; createdAt?: unknown;
};

const normalizeReply = (r: ApiTicketReply): TicketReply => ({
  id: String(r.id),
  ticket_id: String(r.ticket_id ?? r.ticketId ?? ""),
  user_id: (r.user_id ?? r.userId ?? null) as string | null,
  message: String(r.message ?? ""),
  is_admin: isTrue(r.is_admin ?? r.isAdmin),
  created_at: String(r.created_at ?? r.createdAt ?? ""),
});

export const ticketRepliesApi = baseApi6.injectEndpoints({
  endpoints: (b) => ({

    listTicketRepliesByTicket: b.query<TicketReply[], string>({
      query: (ticketId) => ({ url: `/ticket_replies/by-ticket/${ticketId}` }),
      transformResponse: (res: unknown): TicketReply[] =>
        Array.isArray(res) ? (res as ApiTicketReply[]).map(normalizeReply) : [],
      providesTags: (_r, _e, ticketId) => [{ type: "TicketReplies", id: `TICKET_${ticketId}` }],
    }),

    /** Yeni yanıt oluştur (kullanıcı veya admin) */
    createTicketReply: b.mutation<
      TicketReply,
      { ticket_id: string; user_id?: string | null; message: string; is_admin?: boolean }
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
          is_admin: body.is_admin ? 1 : 0,
          isAdmin: body.is_admin ? 1 : 0,
        },
      }),
      transformResponse: (res: unknown): TicketReply => normalizeReply(res as ApiTicketReply),
      invalidatesTags: (_r, _e, arg) => [{ type: "TicketReplies", id: `TICKET_${arg.ticket_id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTicketRepliesByTicketQuery,
  useCreateTicketReplyMutation,
} = ticketRepliesApi;
