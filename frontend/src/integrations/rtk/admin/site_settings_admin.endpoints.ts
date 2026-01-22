// =============================================================
// FILE: src/integrations/rtk/admin/site_settings_admin.endpoints.ts
// FINAL — Admin SiteSettings RTK (central types + helpers)
// - exactOptionalPropertyTypes friendly
// - no explicit any
// - consistent signatures: create(body), update({ key, body }), delete(key)
// =============================================================

import { baseApi } from '@/integrations/baseApi';

import type {
  AdminSiteSetting,
  SiteSettingRow,
  SiteSettingsAdminListParams,
  UpsertSiteSettingBody,
  BulkUpsertSiteSettingBody,
  DeleteManySiteSettingsParams,
} from '@/integrations/types';

import {
  normalizeAdminSiteSetting,
  normalizeAdminSiteSettingList,
  toAdminSiteSettingsQuery,
  toDeleteManySiteSettingsQuery,
  toUpsertSiteSettingApiBody,
  toBulkUpsertSiteSettingsApiBody,
} from '@/integrations/types';

const ADMIN_BASE = '/admin/site_settings';

const extendedApi = baseApi.enhanceEndpoints({
  addTagTypes: ['SiteSettings'] as const,
});

export const siteSettingsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/site_settings
    listSiteSettingsAdmin: b.query<AdminSiteSetting[], SiteSettingsAdminListParams | void>({
      query: (p) => {
        const qp = p ? toAdminSiteSettingsQuery(p) : undefined;
        return { url: ADMIN_BASE, ...(qp ? { params: qp } : {}) };
      },
      transformResponse: (res: unknown): AdminSiteSetting[] => normalizeAdminSiteSettingList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((s) => ({ type: 'SiteSettings' as const, id: s.key })),
              { type: 'SiteSettings' as const, id: 'LIST' },
            ]
          : [{ type: 'SiteSettings' as const, id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),

    // GET /admin/site_settings/:key
    getSiteSettingAdminByKey: b.query<AdminSiteSetting | null, string>({
      query: (key) => ({ url: `${ADMIN_BASE}/${encodeURIComponent(key)}` }),
      transformResponse: (res: unknown): AdminSiteSetting | null =>
        res ? normalizeAdminSiteSetting(res as SiteSettingRow) : null,
      providesTags: (_r, _e, key) => [{ type: 'SiteSettings' as const, id: key }],
      keepUnusedDataFor: 60,
    }),

    // POST /admin/site_settings
    createSiteSettingAdmin: b.mutation<AdminSiteSetting, UpsertSiteSettingBody>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body: toUpsertSiteSettingApiBody(body),
      }),
      transformResponse: (res: unknown): AdminSiteSetting =>
        normalizeAdminSiteSetting(res as SiteSettingRow),
      invalidatesTags: [{ type: 'SiteSettings' as const, id: 'LIST' }],
    }),

    // PATCH /admin/site_settings/:key
    // Signature aligned: update({ key, body })
    updateSiteSettingAdmin: b.mutation<
      AdminSiteSetting,
      { key: string; body: Partial<UpsertSiteSettingBody> }
    >({
      query: ({ key, body }) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'PATCH',
        body: toUpsertSiteSettingApiBody({
          // key BE’de path’te zaten var; ama body builder minimum key+value bekliyorsa:
          // - burada key’i de güvenli biçimde yolluyoruz
          key,
          value: body.value as UpsertSiteSettingBody['value'],
          ...(typeof body.value_type !== 'undefined' ? { value_type: body.value_type } : {}),
          ...(typeof body.group !== 'undefined' ? { group: body.group } : {}),
          ...(typeof body.description !== 'undefined' ? { description: body.description } : {}),
        }),
      }),
      transformResponse: (res: unknown): AdminSiteSetting =>
        normalizeAdminSiteSetting(res as SiteSettingRow),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SiteSettings' as const, id: arg.key },
        { type: 'SiteSettings' as const, id: 'LIST' },
      ],
    }),

    // POST /admin/site_settings/bulk-upsert
    bulkUpsertSiteSettingsAdmin: b.mutation<AdminSiteSetting[], BulkUpsertSiteSettingBody>({
      query: ({ items }) => ({
        url: `${ADMIN_BASE}/bulk-upsert`,
        method: 'POST',
        body: toBulkUpsertSiteSettingsApiBody(items),
      }),
      transformResponse: (res: unknown): AdminSiteSetting[] => normalizeAdminSiteSettingList(res),
      invalidatesTags: [{ type: 'SiteSettings' as const, id: 'LIST' }],
    }),

    // DELETE /admin/site_settings/:key
    deleteSiteSettingAdmin: b.mutation<{ ok: true }, string>({
      query: (key) => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(key)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, key) => [
        { type: 'SiteSettings' as const, id: key },
        { type: 'SiteSettings' as const, id: 'LIST' },
      ],
    }),

    // DELETE /admin/site_settings?keys=... / prefix / key! ...
    deleteManySiteSettingsAdmin: b.mutation<{ ok: true }, DeleteManySiteSettingsParams>({
      query: (p) => {
        const qp = toDeleteManySiteSettingsQuery(p);
        return {
          url: ADMIN_BASE,
          method: 'DELETE',
          ...(Object.keys(qp).length ? { params: qp } : {}),
        };
      },
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: 'SiteSettings' as const, id: 'LIST' }],
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
  useDeleteManySiteSettingsAdminMutation,
} = siteSettingsAdminApi;
