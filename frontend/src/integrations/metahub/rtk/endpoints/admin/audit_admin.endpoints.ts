
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/audit_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "@/integrations/metahub/rtk/baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : String(x).toLowerCase() === "true" || String(x) === "1");
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* no-op */ }
  }
  return x as T;
};

// -------- Audit Logs --------
export type AuditLog = {
  id: string;
  action: string;                 // e.g. "settings.update", "auth.login"
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  ip: string | null;
  user_agent: string | null;
  resource_type: string | null;   // e.g. "site_settings"
  resource_id: string | null;
  success: boolean;
  message: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;             // ISO
};

export type ApiAuditLog = Omit<AuditLog, "success" | "created_at" | "changes"> & {
  success: boolean | 0 | 1 | "0" | "1" | string;
  created_at: string | number | Date;
  changes: string | AuditLog["changes"] | null;
};

const normalizeAudit = (a: ApiAuditLog): AuditLog => ({
  ...a,
  success: toBool(a.success),
  created_at: toIso(a.created_at),
  changes: a.changes == null ? null : tryParse<AuditLog["changes"]>(a.changes),
});

export type AuditListParams = {
  q?: string; // actor_email/name/ip/action/message
  action?: string;
  actor_id?: string;
  actor_email?: string;
  resource_type?: string;
  resource_id?: string;
  success?: boolean;
  since?: string; // ISO
  until?: string; // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "action" | "actor_email" | "success";
  order?: "asc" | "desc";
};

export type ExportResponse = { url: string; expires_at: string | null };

// -------- Config History --------
export type ConfigChange = {
  id: string;
  key: string;                      // e.g. "home_header_top_text"
  old_value: unknown | null;
  new_value: unknown | null;
  actor_id: string | null;
  actor_email: string | null;
  reason: string | null;
  created_at: string;               // ISO
};

export type ApiConfigChange = Omit<ConfigChange, "old_value" | "new_value" | "created_at"> & {
  old_value: string | unknown | null;
  new_value: string | unknown | null;
  created_at: string | number | Date;
};

const normalizeChange = (c: ApiConfigChange): ConfigChange => ({
  ...c,
  old_value: c.old_value == null ? null : tryParse<unknown>(c.old_value),
  new_value: c.new_value == null ? null : tryParse<unknown>(c.new_value),
  created_at: toIso(c.created_at),
});

export type ConfigListParams = {
  q?: string;          // key/actor_email/reason
  key?: string;
  actor_id?: string;
  actor_email?: string;
  since?: string; until?: string; // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "key"; order?: "asc" | "desc";
};

export type ConfigDiff = {
  id: string;
  key: string;
  before: unknown | null;
  after: unknown | null;
  unified?: string | null;  // unified text diff, if provided by BE
};

export type RevertBody = { reason?: string | null };

export const auditAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // AUDIT LOGS
    listAuditLogsAdmin: b.query<AuditLog[], AuditListParams | void>({
      query: (params) => ({ url: "/audit/logs", params }),
      transformResponse: (res: unknown): AuditLog[] => {
        if (Array.isArray(res)) return (res as ApiAuditLog[]).map(normalizeAudit);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiAuditLog[]).map(normalizeAudit) : [];
      },
      providesTags: (result) => result
        ? [
          ...result.map((x) => ({ type: "AuditLogs" as const, id: x.id })),
          { type: "AuditLogs" as const, id: "LIST" },
        ]
        : [{ type: "AuditLogs" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getAuditLogAdminById: b.query<AuditLog, string>({
      query: (id) => ({ url: `/audit/logs/${id}` }),
      transformResponse: (res: unknown): AuditLog => normalizeAudit(res as ApiAuditLog),
      providesTags: (_r, _e, id) => [{ type: "AuditLogs", id }],
    }),

    exportAuditLogsAdmin: b.mutation<ExportResponse, AuditListParams | void>({
      query: (params) => ({ url: "/audit/logs/export", method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),

    // CONFIG HISTORY
    listConfigHistoryAdmin: b.query<ConfigChange[], ConfigListParams | void>({
      query: (params) => ({ url: "/config/history", params }),
      transformResponse: (res: unknown): ConfigChange[] => {
        if (Array.isArray(res)) return (res as ApiConfigChange[]).map(normalizeChange);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiConfigChange[]).map(normalizeChange) : [];
      },
      providesTags: (result) => result
        ? [
          ...result.map((x) => ({ type: "ConfigHistory" as const, id: x.id })),
          { type: "ConfigHistory" as const, id: "LIST" },
        ]
        : [{ type: "ConfigHistory" as const, id: "LIST" }],
    }),

    getConfigChangeAdminById: b.query<ConfigChange, string>({
      query: (id) => ({ url: `/config/history/${id}` }),
      transformResponse: (res: unknown): ConfigChange => normalizeChange(res as ApiConfigChange),
      providesTags: (_r, _e, id) => [{ type: "ConfigHistory", id }],
    }),

    getConfigChangeDiffAdmin: b.query<ConfigDiff, string>({
      query: (id) => ({ url: `/config/history/${id}/diff` }),
      transformResponse: (res: unknown): ConfigDiff => {
        const x = res as Partial<ConfigDiff> & { before?: unknown; after?: unknown };
        return {
          id: String(x.id ?? ""),
          key: String((x as { key?: unknown }).key ?? ""),
          before: x.before ?? null,
          after: x.after ?? null,
          unified: (x as { unified?: unknown }).unified == null ? null : String((x as { unified?: unknown }).unified),
        };
      },
      providesTags: (_r, _e, id) => [{ type: "ConfigHistory", id: `DIFF_${id}` }],
    }),

    revertConfigChangeAdmin: b.mutation<ConfigChange, { id: string; body?: RevertBody }>({
      query: ({ id, body }) => ({ url: `/config/history/${id}/revert`, method: "POST", body }),
      transformResponse: (res: unknown): ConfigChange => normalizeChange(res as ApiConfigChange),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ConfigHistory", id: arg.id },
        { type: "ConfigHistory", id: "LIST" },
      ],
    }),

    exportConfigHistoryAdmin: b.mutation<ExportResponse, ConfigListParams | void>({
      query: (params) => ({ url: "/config/history/export", method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAuditLogsAdminQuery,
  useGetAuditLogAdminByIdQuery,
  useExportAuditLogsAdminMutation,
  useListConfigHistoryAdminQuery,
  useGetConfigChangeAdminByIdQuery,
  useGetConfigChangeDiffAdminQuery,
  useRevertConfigChangeAdminMutation,
  useExportConfigHistoryAdminMutation,
} = auditAdminApi;
