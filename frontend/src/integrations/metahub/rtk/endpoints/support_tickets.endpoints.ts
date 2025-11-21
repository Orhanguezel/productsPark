// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/support_tickets.endpoints.ts
// =============================================================
import { baseApi as baseApi5 } from "../baseApi";
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  ApiSupportTicket,
} from "../types/support";

/* ---------------- Helpers ---------------- */

const trim = (v: string | undefined | null): string =>
  (v ?? "").toString().trim();

/** Eski adlardan yeni statülere güvenli map */
const mapStatus = (raw: unknown): SupportTicketStatus => {
  const s = trim(typeof raw === "string" ? raw : String(raw ?? "")).toLowerCase();
  if (s === "open") return "open";
  if (s === "in_progress") return "in_progress";
  if (s === "waiting_response") return "waiting_response";
  if (s === "closed") return "closed";
  // Eski isimlerden gelenler:
  if (s === "answered") return "waiting_response";
  if (s === "resolved") return "closed";
  // Default
  return "open";
};

const mapPriority = (raw: unknown): SupportTicketPriority => {
  const p = trim(typeof raw === "string" ? raw : String(raw ?? "")).toLowerCase();
  if (p === "low" || p === "medium" || p === "high" || p === "urgent") return p;
  return "medium";
};

const normalizeTicket = (t: ApiSupportTicket): SupportTicket => {
  const id = trim(t.id);
  const user_id = trim(t.user_id ?? t.userId);
  const subject = trim(t.subject);
  const message = trim(t.message);
  const status = mapStatus(t.status);
  const priority = mapPriority(t.priority);
  const category = typeof t.category === "string" ? t.category : null;

  const created_at = trim(t.created_at ?? t.createdAt);
  const updated_at = trim(
    t.updated_at ?? t.updatedAt ?? t.created_at ?? t.createdAt ?? created_at
  );

  return {
    id,
    user_id,
    subject,
    message,
    status,
    priority,
    category,
    created_at,
    updated_at,
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
  if (p?.user_id) q.user_id = p.user_id;
  if (p?.status) q.status = p.status;
  if (p?.priority) q.priority = p.priority;
  if (p?.q) q.q = p.q;
  if (p?.limit != null) q.limit = p.limit;
  if (p?.offset != null) q.offset = p.offset;
  // BE sadece "created_at" | "updated_at" kabul eder → olduğu gibi gönder
  if (p?.sort) q.sort = p.sort;
  // "asc" | "desc" zaten uygun
  if (p?.order) q.order = p.order;
  return q;
};

/* ---------------- RTK Endpoints ---------------- */

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
      transformResponse: (res: unknown): SupportTicket[] => {
        if (!Array.isArray(res)) return [];
        // `res` dizisinin öğelerini `ApiSupportTicket` gibi işleyip normalize ediyoruz
        return (res as unknown[]).map((row) => normalizeTicket(row as ApiSupportTicket));
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map((t) => ({ type: "SupportTicket" as const, id: t.id })),
            { type: "SupportTickets" as const, id: "LIST" },
          ]
          : [{ type: "SupportTickets" as const, id: "LIST" }],
    }),

    getSupportTicketById: b.query<SupportTicket, string>({
      query: (id) => ({ url: `/support_tickets/${id}` }),
      transformResponse: (res: unknown): SupportTicket =>
        normalizeTicket(res as ApiSupportTicket),
      providesTags: (_r, _e, id) => [{ type: "SupportTicket", id }],
    }),

    /** Yeni ticket oluştur (UI create formu için) */
    createSupportTicket: b.mutation<
      SupportTicket,
      {
        user_id: string;
        subject: string;
        message: string;
        priority?: SupportTicketPriority;
        category?: string | null;
      }
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
      transformResponse: (res: unknown): SupportTicket =>
        normalizeTicket(res as ApiSupportTicket),
      invalidatesTags: [{ type: "SupportTickets", id: "LIST" }],
    }),

    /** Durum/öncelik güncelleme */
    updateSupportTicket: b.mutation<
      SupportTicket,
      {
        id: string;
        patch: Partial<
          Pick<SupportTicket, "status" | "priority" | "subject" | "message" | "category">
        >;
      }
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
      transformResponse: (res: unknown): SupportTicket =>
        normalizeTicket(res as ApiSupportTicket),
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
