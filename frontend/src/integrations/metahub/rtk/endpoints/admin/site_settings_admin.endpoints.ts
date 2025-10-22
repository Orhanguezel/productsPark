// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/site_settings_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "@/integrations/metahub/rtk/baseApi";

export type ValueType = "string" | "number" | "boolean" | "json";

export type SettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | null;

export type SiteSetting = {
  key: string;
  value: SettingValue;
  value_type: ValueType | null; // optional hint from BE
  group: string | null; // logical grouping (e.g., "home", "seo")
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiSiteSetting = Omit<
  SiteSetting,
  "value" | "value_type" | "group" | "description"
> & {
  value: unknown; // BE may return string/number/boolean or JSON-string
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x as unknown);

const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};

const tryParseJson = (s: string): SettingValue => {
  try {
    return JSON.parse(s) as SettingValue;
  } catch {
    return s;
  }
};

const normalizeValue = (value: unknown, value_type?: ValueType | null): SettingValue => {
  if (value_type === "boolean") return toBool(value);
  if (value_type === "number") return value == null ? null : toNumber(value);
  if (value_type === "json") {
    if (typeof value === "string") return tryParseJson(value);
    if (value && typeof value === "object") return value as SettingValue;
    return null;
  }
  // default/string
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value == null) return null;
  // object without explicit json hint -> keep as-is
  return value as SettingValue;
};

const normalizeSetting = (s: ApiSiteSetting): SiteSetting => ({
  key: s.key,
  value_type: s.value_type ?? null,
  group: s.group ?? null,
  description: s.description ?? null,
  value: normalizeValue(s.value, s.value_type ?? null),
  created_at: s.created_at,
  updated_at: s.updated_at,
});

export type ListParams = {
  q?: string; // search by key or description
  group?: string;
  keys?: string[]; // direct selection
  limit?: number;
  offset?: number;
  sort?: "key" | "updated_at" | "created_at";
  order?: "asc" | "desc";
};

export type UpsertSettingBody = {
  key: string;
  value: SettingValue;
  value_type?: ValueType | null;
  group?: string | null;
  description?: string | null;
};

export type BulkUpsertBody = {
  items: UpsertSettingBody[];
};

export const siteSettingsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listSiteSettingsAdmin: b.query<SiteSetting[], ListParams | void>({
      query: (params) => {
        if (!params) return { url: "/site_settings" };
        const { keys, ...rest } = params;
        return {
          url: "/site_settings",
          params: { ...rest, keys: keys && keys.length ? keys.join(",") : undefined },
        };
      },
      transformResponse: (res: unknown): SiteSetting[] =>
        Array.isArray(res)
          ? (res as ApiSiteSetting[]).map(normalizeSetting)
          : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "SiteSettings" as const, id: s.key })),
              { type: "SiteSettings" as const, id: "LIST" },
            ]
          : [{ type: "SiteSettings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getSiteSettingAdminByKey: b.query<SiteSetting | null, string>({
      query: (key) => ({ url: `/site_settings/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): SiteSetting | null =>
        res ? normalizeSetting(res as ApiSiteSetting) : null,
      providesTags: (_r, _e, key) => [{ type: "SiteSettings", id: key }],
    }),

    createSiteSettingAdmin: b.mutation<SiteSetting, UpsertSettingBody>({
      query: (body) => ({ url: "/site_settings", method: "POST", body }),
      transformResponse: (res: unknown): SiteSetting =>
        normalizeSetting(res as ApiSiteSetting),
      invalidatesTags: [{ type: "SiteSettings", id: "LIST" }],
    }),

    updateSiteSettingAdmin: b.mutation<SiteSetting, { key: string; body: UpsertSettingBody }>({
      query: ({ key, body }) => ({
        url: `/site_settings/${encodeURIComponent(key)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: unknown): SiteSetting =>
        normalizeSetting(res as ApiSiteSetting),
      invalidatesTags: (_r, _e, arg) => [
        { type: "SiteSettings", id: arg.key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    deleteSiteSettingAdmin: b.mutation<{ ok: true }, string>({
      query: (key) => ({
        url: `/site_settings/${encodeURIComponent(key)}`,
        method: "DELETE",
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, key) => [
        { type: "SiteSettings", id: key },
        { type: "SiteSettings", id: "LIST" },
      ],
    }),

    bulkUpsertSiteSettingsAdmin: b.mutation<{ ok: true }, BulkUpsertBody>({
      query: (body) => ({ url: "/site_settings/bulk-upsert", method: "POST", body }),
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
