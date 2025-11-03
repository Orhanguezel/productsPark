import { baseApi } from "../../baseApi";
import type { ApiTicketReply, TicketReply } from "../../../db/types/support";

const asStr = (x: unknown) => (typeof x === "string" ? x : String(x ?? ""));
const isTrue = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

const normalizeReply = (r: ApiTicketReply): TicketReply => ({
  id: asStr(r.id),
  ticket_id: asStr(r.ticket_id ?? r.ticketId ?? ""),
  user_id: (r.user_id ?? r.userId ?? null) as string | null,
  message: asStr(r.message ?? ""),
  is_admin: isTrue(r.is_admin ?? r.isAdmin),
  created_at: asStr(r.created_at ?? r.createdAt ?? ""),
});

export const ticketRepliesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTicketRepliesAdmin: b.query<TicketReply[], string>({
      query: (ticketId) => ({ url: `/admin/ticket_replies/by-ticket/${ticketId}` }),
      transformResponse: (res: unknown): TicketReply[] =>
        Array.isArray(res) ? (res as ApiTicketReply[]).map(normalizeReply) : [],
      providesTags: (_r, _e, ticketId) => [{ type: "TicketReplies", id: `TICKET_${ticketId}` }],
    }),

    createTicketReplyAdmin: b.mutation<
      TicketReply,
      { ticket_id: string; user_id?: string | null; message: string }
    >({
      query: (body) => ({
        url: `/admin/ticket_replies`,
        method: "POST",
        body, // BE admin hep is_admin = true yapıyor
      }),
      transformResponse: (res: unknown): TicketReply => normalizeReply(res as ApiTicketReply),
      invalidatesTags: (_r, _e, arg) => [{ type: "TicketReplies", id: `TICKET_${arg.ticket_id}` }],
    }),

    deleteTicketReplyAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/ticket_replies/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
  useDeleteTicketReplyAdminMutation,
} = ticketRepliesAdminApi;
