import { baseApi as baseApi5 } from "../baseApi";

/** DB enumlarına göre güncel tipler */
export type SupportTicketStatus = "open" | "in_progress" | "waiting_response" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  /** UI bu alanı zorunlu bekliyor → null olabilir ama undefined OLMAZ */
  category: string | null;
  created_at: string;
  updated_at: string;
};

/** Normalize yardımcıları */
const str = (x: unknown) => (typeof x === "string" ? x : String(x ?? ""));
const coStatus = (s: unknown): SupportTicketStatus => {
  const v = str(s).trim() as SupportTicketStatus | "";
  return v === "" ? "open" : v;
};
const coPriority = (p: unknown): SupportTicketPriority => {
  const v = str(p).trim() as SupportTicketPriority | "";
  return v === "" ? "medium" : v;
};

/** BE hem snake hem camel dönebilir */
type ApiSupportTicket = {
  id?: unknown;

  user_id?: unknown; userId?: unknown;
  subject?: unknown;
  message?: unknown;

  status?: unknown;
  priority?: unknown;
  category?: unknown;

  created_at?: unknown; createdAt?: unknown;
  updated_at?: unknown; updatedAt?: unknown;
};

const normalizeTicket = (t: ApiSupportTicket): SupportTicket => {
  const user_id = str(t.user_id ?? t.userId ?? "");
  const created_at = str(t.created_at ?? t.createdAt ?? "");
  const updated_at_raw = t.updated_at ?? t.updatedAt ?? t.created_at ?? t.createdAt ?? created_at;

  return {
    id: str(t.id),
    user_id,
    subject: str(t.subject),
    message: str(t.message),
    status: coStatus(t.status),
    priority: coPriority(t.priority),
    category: (typeof t.category === "string" ? t.category : null),
    created_at,
    updated_at: str(updated_at_raw),
  };
};

/** FE’den gelen snake paramları BE’nin camel beklentisine çevir */
const toQuery = (p?: {
  user_id?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at";
  order?: "asc" | "desc";
}) => {
  const q: Record<string, unknown> = {};
  if (!p) return q;
  if (p.user_id) q.userId = p.user_id;
  if (p.status) q.status = p.status;
  if (p.priority) q.priority = p.priority;
  if (p.q) q.q = p.q;
  if (p.limit != null) q.limit = p.limit;
  if (p.offset != null) q.offset = p.offset;
  if (p.sort) q.sort = p.sort === "created_at" ? "createdAt" : "updatedAt";
  if (p.order) q.order = p.order;
  return q;
};

export const supportTicketsApi = baseApi5.injectEndpoints({
  endpoints: (b) => ({

    listSupportTickets: b.query<
      SupportTicket[],
      {
        user_id?: string;
        status?: SupportTicketStatus;
        priority?: SupportTicketPriority;
        q?: string;
        limit?: number;
        offset?: number;
        sort?: "created_at" | "updated_at";
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/support_tickets", params: toQuery(params) }),
      transformResponse: (res: unknown): SupportTicket[] =>
        Array.isArray(res) ? (res as ApiSupportTicket[]).map(normalizeTicket) : [],
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "SupportTicket" as const, id: t.id })), { type: "SupportTickets" as const, id: "LIST" }]
          : [{ type: "SupportTickets" as const, id: "LIST" }],
    }),

    getSupportTicketById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `/support_tickets/${id}` }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      providesTags: (_r, _e, id) => [{ type: "SupportTicket", id }],
    }),

    /** Yeni ticket oluştur (UI create formu için) */
    createSupportTicket: b.mutation<
      SupportTicket,
      { user_id: string; subject: string; message: string; priority?: SupportTicketPriority; category?: string | null }
    >({
      query: (body) => ({
        url: "/support_tickets",
        method: "POST",
        /** BE ne beklerse onu karşılamak için hem snake hem camel gönderiyoruz */
        body: {
          user_id: body.user_id,
          userId: body.user_id,
          subject: body.subject,
          message: body.message,
          priority: body.priority ?? "medium",
          ...(typeof body.category !== "undefined" ? { category: body.category } : {}),
        },
      }),
      transformResponse: (res: unknown): SupportTicket => normalizeTicket(res as ApiSupportTicket),
      invalidatesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),

    /** Durum/öncelik güncelleme */
    updateSupportTicket: b.mutation<
      SupportTicket,
      { id: string; patch: Partial<Pick<SupportTicket, "status" | "priority" | "subject" | "message" | "category">> }
    >({
      query: ({ id, patch }) => ({
        url: `/support_tickets/${id}`,
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
      invalidatesTags: (_r, _e, arg) => [{ type: "SupportTicket", id: arg.id }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSupportTicketsQuery,
  useGetSupportTicketByIdQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
} = supportTicketsApi;
