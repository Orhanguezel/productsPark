// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints.ts
// (path senin importuna göre admin/ klasöründe)
// =============================================================
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import type { SiteSettingRow, SettingValue, ValueType } from "@/integrations/metahub/db/types/site";
import { normalizeSettingValue } from "@/integrations/metahub/db/normalizers/site";

export type SiteSetting = SiteSettingRow; // FE tek modelden beslensin

export type ListParams = {
  q?: string;
  group?: string;
  keys?: string[];
  limit?: number;
  offset?: number;
  sort?: "key" | "updated_at" | "created_at";
  order?: "asc" | "desc";
};

export type UpsertSettingBody = {
  key: string;
  value: SettingValue;        // tek kaynaktan
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

export type BulkUpsertBody = { items: UpsertSettingBody[] };

// BE: admin yazma -> /admin/site_settings, okuma -> /site_settings
const ADMIN_BASE = "/admin/site_settings";
const PUBLIC_BASE = "/site_settings";

const norm = (s: SiteSettingRow): SiteSettingRow => ({
  ...s,
  value: normalizeSettingValue(s.value, s.value_type ?? null),
});

export const siteSettingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettingsAdmin: b.query<SiteSetting[], ListParams | void>({
      query: (params) => {
        if (!params) return { url: PUBLIC_BASE };
        const { keys, sort, order, ...rest } = params;

        // public GET /site_settings beklediği paramlara çevir:
        // - keys[] -> key_in
        // - sort+order -> order="col.dir"
        const key_in = keys && keys.length ? keys.join(",") : undefined;
        const combinedOrder =
          sort && order ? `${sort}.${order}` :
          sort ? `${sort}.asc` :
          order ? `key.${order}` :
          undefined;

        return {
          url: PUBLIC_BASE,
          params: { ...rest, key_in, order: combinedOrder },
        };
      },
      transformResponse: (res: unknown): SiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(norm) : [],
      providesTags: (result) =>
        result
          ? [...result.map((s) => ({ type: "SiteSettings" as const, id: s.key })), { type: "SiteSettings" as const, id: "LIST" }]
          : [{ type: "SiteSettings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getSiteSettingAdminByKey: b.query<SiteSetting | null, string>({
      query: (key) => ({ url: `${PUBLIC_BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): SiteSetting | null =>
        res ? norm(res as SiteSettingRow) : null,
      providesTags: (_r, _e, key) => [{ type: "SiteSettings", id: key }],
    }),

    createSiteSettingAdmin: b.mutation<SiteSetting, UpsertSettingBody>({
      query: (body) => ({ url: ADMIN_BASE, method: "POST", body }),
      transformResponse: (res: unknown): SiteSetting => norm(res as SiteSettingRow),
      invalidatesTags: [{ type: "SiteSettings", id: "LIST" }],
    }),

    updateSiteSettingAdmin: b.mutation<SiteSetting, { key: string; body: UpsertSettingBody }>({
      query: ({ key, body }) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(key)}`, method: "PUT", body }),
      transformResponse: (res: unknown): SiteSetting => norm(res as SiteSettingRow),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SiteSettings", id: arg.key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    deleteSiteSettingAdmin: b.mutation<{ ok: true }, string>({
      query: (key) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(key)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, key) => [
        { type: "SiteSettings", id: key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, BulkUpsertBody>({
      query: (body) => ({ url: `${ADMIN_BASE}/bulk-upsert`, method: "POST", body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "SiteSettings", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSiteSettingsAdminQuery,
  useGetSiteSettingAdminByKeyQuery,
  useCreateSiteSettingAdminMutation,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
  useBulkUpsertSiteSettingsAdminMutation,
} = siteSettingsAdminApi;
