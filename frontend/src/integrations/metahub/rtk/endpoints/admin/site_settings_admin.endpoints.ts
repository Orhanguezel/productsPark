// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import type {
  SiteSettingRow,
  SettingValue,
  ValueType,
} from "@/integrations/metahub/db/types/site";
import { normalizeSettingValue } from "@/integrations/metahub/db/normalizers/site";

export type SiteSetting = SiteSettingRow; // FE tek modelden beslensin

export type ListParams = {
  q?: string;
  group?: string;
  keys?: string[];
  prefix?: string;
  limit?: number;
  offset?: number;
  sort?: "key" | "updated_at" | "created_at";
  order?: "asc" | "desc";
};

export type UpsertSettingBody = {
  key: string;
  value: SettingValue; // tek kaynaktan
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

export type BulkUpsertBody = { items: UpsertSettingBody[] };

// ✅ Admin base path — backend ile birebir aynı
const ADMIN_BASE = "/admin/site_settings";

const norm = (s: SiteSettingRow): SiteSettingRow => ({
  ...s,
  value: normalizeSettingValue(s.value, s.value_type ?? null),
});

export const siteSettingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/site_settings
    listSiteSettingsAdmin: b.query<SiteSetting[], ListParams | void>({
      query: (params) => {
        if (!params) {
          return { url: ADMIN_BASE };
        }

        const { keys, sort, order, ...rest } = params;

        // 🔹 Backend adminListSiteSettings 'keys' paramını bekliyor
        const keysParam =
          keys && keys.length ? keys.join(",") : undefined;

        const combinedOrder =
          sort && order
            ? `${sort}.${order}`
            : sort
            ? `${sort}.asc`
            : order
            ? `key.${order}`
            : undefined;

        return {
          url: ADMIN_BASE,
          params: {
            ...rest,
            keys: keysParam,
            order: combinedOrder,
          },
        };
      },
      transformResponse: (res: unknown): SiteSetting[] =>
        Array.isArray(res) ? (res as SiteSettingRow[]).map(norm) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({
                type: "SiteSettings" as const,
                id: s.key,
              })),
              { type: "SiteSettings" as const, id: "LIST" },
            ]
          : [{ type: "SiteSettings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/site_settings/:key
    getSiteSettingAdminByKey: b.query<SiteSetting | null, string>({
      query: (key) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
      }),
      transformResponse: (res: unknown): SiteSetting | null =>
        res ? norm(res as SiteSettingRow) : null,
      providesTags: (_r, _e, key) => [{ type: "SiteSettings", id: key }],
    }),

    // POST /admin/site_settings
    createSiteSettingAdmin: b.mutation<SiteSetting, UpsertSettingBody>({
      query: (body) => ({ url: ADMIN_BASE, method: "POST", body }),
      transformResponse: (res: unknown): SiteSetting =>
        norm(res as SiteSettingRow),
      invalidatesTags: [{ type: "SiteSettings", id: "LIST" }],
    }),

    // PUT /admin/site_settings/:key
    updateSiteSettingAdmin: b.mutation<
      SiteSetting,
      { key: string; body: UpsertSettingBody }
    >({
      query: ({ key, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: unknown): SiteSetting =>
        norm(res as SiteSettingRow),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SiteSettings", id: arg.key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    // DELETE /admin/site_settings/:key
    deleteSiteSettingAdmin: b.mutation<{ ok: true }, string>({
      query: (key) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: "DELETE",
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, key) => [
        { type: "SiteSettings", id: key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    // ✅ POST /admin/site_settings/bulk-upsert  (bulk)
    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, BulkUpsertBody>({
      query: (body) => ({
        url: `${ADMIN_BASE}/bulk-upsert`,
        method: "POST",
        body,
      }),
      // BE array dönüyor ama biz FE'de sadece "ok" istiyoruz
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "SiteSettingsBulk", id: "LIST" }],
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
