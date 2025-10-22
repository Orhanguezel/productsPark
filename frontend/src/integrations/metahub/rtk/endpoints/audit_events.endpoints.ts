

// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/audit_events.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApiAu } from "../baseApi";
const tryParseAu = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {} } return x as T; };

export type AuditEvent = {
  id: string;
  actor_id?: string | null;
  action: string;                         // e.g., "order.update"
  resource: string;                       // e.g., "orders"
  resource_id: string;
  diff?: Record<string, unknown> | null;  // JSON patch/diff
  created_at: string;
};

type ApiAudit = Omit<AuditEvent, "diff"> & { diff?: string | AuditEvent["diff"] };
const normalizeAudit = (e: ApiAudit): AuditEvent => ({ ...e, diff: e.diff ? tryParseAu<AuditEvent["diff"]>(e.diff) : null });

export const auditEventsApi = baseApiAu.injectEndpoints({
  endpoints: (b) => ({
    listAuditEvents: b.query<AuditEvent[], { resource?: string; resource_id?: string; action?: string; limit?: number; offset?: number; order?: "asc" | "desc" }>({
      query: (params) => ({ url: "/audit_events", params }),
      transformResponse: (res: unknown): AuditEvent[] => Array.isArray(res) ? (res as ApiAudit[]).map(normalizeAudit) : [],
      providesTags: (result) => result ? [
        ...result.map((e) => ({ type: "Audit" as const, id: e.id })),
        { type: "Audits" as const, id: "LIST" },
      ] : [{ type: "Audits" as const, id: "LIST" }],
    }),

    getAuditEventById: b.query<AuditEvent, string>({
      query: (id) => ({ url: `/audit_events/${id}` }),
      transformResponse: (res: unknown): AuditEvent => normalizeAudit(res as ApiAudit),
      providesTags: (_r, _e, id) => [{ type: "Audit", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListAuditEventsQuery, useGetAuditEventByIdQuery } = auditEventsApi;
