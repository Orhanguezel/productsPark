import { baseApi } from "../../baseApi";
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  ApiSupportTicket,
} from "../../../db/types/support";

/** Helpers (normalize) */
const asStr = (x: unknown) => (typeof x === "string" ? x : String(x ?? ""));
const asStatus = (s: unknown): SupportTicketStatus => {
  const v = asStr(s).trim() as SupportTicketStatus | "";
  return v === "" ? "open" : v;
};
const asPriority = (p: unknown): SupportTicketPriority => {
  const v = asStr(p).trim() as SupportTicketPriority | "";
  return v === "" ? "medium" : v;
};
const normalizeTicket = (t: ApiSupportTicket): SupportTicket => {
  const created_at = asStr(t.created_at ?? t.createdAt ?? "");
  const updated_at = asStr(t.updated_at ?? t.updatedAt ?? created_at);
  return {
    id: asStr(t.id),
    user_id: asStr(t.user_id ?? t.userId ?? ""),
    subject: asStr(t.subject),
    message: asStr(t.message),
    status: asStatus(t.status),
    priority: asPriority(t.priority),
    category: typeof t.category === "string" ? t.category : null,
    created_at,
    updated_at,
  };
};

export type SupportAdminListParams = {
  user_id?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
};

const toQuery = (p?: SupportAdminListParams) => {
  if (!p) return undefined;
  const q: Record<string, unknown> = {};
  if (p.user_id) q.user_id = p.user_id;
  if (p.status) q.status = p.status;
  if (p.priority) q.priority = p.priority;
  if (p.q) q.q = p.q;
  if (p.limit != null) q.limit = p.limit;
  if (p.offset != null) q.offset = p.offset;
  if (p.sort) q.sort = p.sort;
  if (p.order) q.order = p.order;
  return q as Record<string, unknown>;
};

export const supportAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSupportTicketsAdmin: b.query<SupportTicket[], SupportAdminListParams | void>({
      query: (params) => ({
        url: "/admin/support_tickets",
        params: params ? toQuery(params) : undefined, // ✅ TS2322 çözümü
      }),
      transformResponse: (res: unknown): SupportTicket[] =>
        Array.isArray(res) ? (res as ApiSupportTicket[]).map(normalizeTicket) : [],
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "SupportTicket" as const, id: t.id })), { type: "SupportTickets", id: "LIST" }]
          : [{ type: "SupportTickets", id: "LIST" }],
    }),

    getSupportTicketAdminById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `/admin/support_tickets/${id}` }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      providesTags: (_r, _e, id) => [{ type: "SupportTicket", id }],
    }),

    updateSupportTicketAdmin: b.mutation<
      SupportTicket,
      { id: string; patch: Partial<Pick<SupportTicket, "status" | "priority" | "subject" | "message" | "category">> }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/support_tickets/${id}`,
        method: "PATCH",
        body: {
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.priority ? { priority: patch.priority } : {}),
          ...(patch.subject ? { subject: patch.subject } : {}),
          ...(patch.message ? { message: patch.message } : {}),
          ...(patch.category !== undefined ? { category: patch.category } : {}),
        },
      }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      invalidatesTags: (_r, _e, arg) => [{ type: "SupportTicket", id: arg.id }, { type: "SupportTickets", id: "LIST" }],
    }),

    deleteSupportTicketAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/support_tickets/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),

    closeSupportTicketAdmin: b.mutation<SupportTicket, string>({
      query: (id) => ({ url: `/admin/support_tickets/${id}/close`, method: "POST" }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      invalidatesTags: (_r, _e, id) => [{ type: "SupportTicket", id }, { type: "SupportTickets", id: "LIST" }],
    }),

    reopenSupportTicketAdmin: b.mutation<SupportTicket, string>({
      query: (id) => ({ url: `/admin/support_tickets/${id}/reopen`, method: "POST" }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      invalidatesTags: (_r, _e, id) => [{ type: "SupportTicket", id }, { type: "SupportTickets", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSupportTicketsAdminQuery,
  useGetSupportTicketAdminByIdQuery,
  useUpdateSupportTicketAdminMutation,
  useDeleteSupportTicketAdminMutation,
  useCloseSupportTicketAdminMutation,
  useReopenSupportTicketAdminMutation,
} = supportAdminApi;
