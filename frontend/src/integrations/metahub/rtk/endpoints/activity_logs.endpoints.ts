

// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/activity_logs.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApiA } from "../baseApi";
const tryParseA = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {} } return x as T; };

export type ActivityLog = {
  id: string;
  user_id?: string | null;
  action: string;                        // e.g., "order_create"
  entity?: string | null;                // e.g., "order"
  entity_id?: string | null;
  meta?: Record<string, unknown> | null; // JSON payload
  created_at: string;
};

type ApiActivity = Omit<ActivityLog, "meta"> & { meta?: string | ActivityLog["meta"] };
const normalizeActivity = (a: ApiActivity): ActivityLog => ({ ...a, meta: a.meta ? tryParseA<ActivityLog["meta"]>(a.meta) : null });

export const activityLogsApi = baseApiA.injectEndpoints({
  endpoints: (b) => ({
    listActivityLogs: b.query<ActivityLog[], { user_id?: string; action?: string; entity?: string; entity_id?: string; limit?: number; offset?: number; order?: "asc" | "desc" }>({
      query: (params) => ({ url: "/activity_logs", params }),
      transformResponse: (res: unknown): ActivityLog[] => Array.isArray(res) ? (res as ApiActivity[]).map(normalizeActivity) : [],
      providesTags: (result) => result ? [
        ...result.map((a) => ({ type: "Activity" as const, id: a.id })),
        { type: "Activities" as const, id: "LIST" },
      ] : [{ type: "Activities" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListActivityLogsQuery } = activityLogsApi;
