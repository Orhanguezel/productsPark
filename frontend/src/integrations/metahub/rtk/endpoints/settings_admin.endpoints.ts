
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/settings_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";

export type SettingValue = string | number | boolean | Record<string, unknown> | unknown[] | null;
export type Setting = { key: string; value: SettingValue; group?: string | null; type?: string | null; updated_at: string };
export type ApiSetting = Omit<Setting, "value" | "updated_at"> & { value: string | unknown | null; updated_at: string | number | Date };

const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const tryParse = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {/* keep as string */} } return x as T; };

const normalizeSetting = (s: ApiSetting): Setting => ({
  ...s,
  value: s.value == null ? null : tryParse<SettingValue>(s.value),
  updated_at: toIso(s.updated_at),
});

export type SettingsListParams = { q?: string; prefix?: string; keys?: string[]; group?: string; limit?: number; offset?: number; sort?: "updated_at" | "key"; order?: "asc" | "desc" };
export type UpsertSettingBody = { key: string; value: SettingValue; group?: string | null; type?: string | null };
export type BulkUpsertSettingsBody = { items: UpsertSettingBody[] };
export type ImportSettingsBody = { items: UpsertSettingBody[] } | { json: Record<string, SettingValue> };
export type ExportResponse = { url: string; expires_at: string | null };

export const settingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSettingsAdmin: b.query<Setting[], SettingsListParams | void>({
      query: (params) => ({ url: "/admin/settings", params }),
      transformResponse: (res: unknown): Setting[] => {
        if (Array.isArray(res)) return (res as ApiSetting[]).map(normalizeSetting);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiSetting[]).map(normalizeSetting) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((s) => ({ type: "Setting" as const, id: s.key })),
        { type: "Settings" as const, id: "LIST" },
      ] : [{ type: "Settings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getSettingAdmin: b.query<Setting, string>({
      query: (key) => ({ url: `/admin/settings/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): Setting => normalizeSetting(res as ApiSetting),
      providesTags: (_r, _e, key) => [{ type: "Setting", id: key }],
    }),

    upsertSettingAdmin: b.mutation<Setting, UpsertSettingBody>({
      query: (body) => ({ url: "/admin/settings", method: "POST", body }),
      transformResponse: (res: unknown): Setting => normalizeSetting(res as ApiSetting),
      invalidatesTags: (_r, _e, arg) => [{ type: "Setting", id: arg.key }, { type: "Settings", id: "LIST" }],
    }),

    bulkUpsertSettingsAdmin: b.mutation<{ updated: number }, BulkUpsertSettingsBody>({
      query: (body) => ({ url: "/admin/settings/bulk", method: "POST", body }),
      transformResponse: (res: unknown): { updated: number } => ({ updated: Number((res as { updated?: unknown })?.updated ?? 0) }),
      invalidatesTags: [{ type: "Settings" as const, id: "LIST" }],
    }),

    deleteSettingAdmin: b.mutation<{ ok: true }, string>({
      query: (key) => ({ url: `/admin/settings/${encodeURIComponent(key)}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, key) => [{ type: "Setting", id: key }, { type: "Settings", id: "LIST" }],
    }),

    importSettingsAdmin: b.mutation<{ imported: number }, ImportSettingsBody>({
      query: (body) => ({ url: "/admin/settings/import", method: "POST", body }),
      transformResponse: (res: unknown): { imported: number } => ({ imported: Number((res as { imported?: unknown })?.imported ?? 0) }),
      invalidatesTags: [{ type: "Settings" as const, id: "LIST" }],
    }),

    exportSettingsAdmin: b.mutation<ExportResponse, SettingsListParams | void>({
      query: (params) => ({ url: "/admin/settings/export", method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSettingsAdminQuery,
  useGetSettingAdminQuery,
  useUpsertSettingAdminMutation,
  useBulkUpsertSettingsAdminMutation,
  useDeleteSettingAdminMutation,
  useImportSettingsAdminMutation,
  useExportSettingsAdminMutation,
} = settingsAdminApi;