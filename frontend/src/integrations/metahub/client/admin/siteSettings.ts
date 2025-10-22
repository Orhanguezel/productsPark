
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/siteSettings.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  siteSettingsAdminApi,
  type SiteSetting,
  type ListParams,
  type UpsertSettingBody,
  type BulkUpsertBody,
} from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";

export const siteSettingsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.listSiteSettingsAdmin.initiate(params)).unwrap(); return { data: data as SiteSetting[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as SiteSetting[] | null, error: { message } }; }
  },
  async getByKey(key: string) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.getSiteSettingAdminByKey.initiate(key)).unwrap(); return { data: (data ?? null) as SiteSetting | null, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as SiteSetting | null, error: { message } }; }
  },
  async create(body: UpsertSettingBody) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.createSiteSettingAdmin.initiate(body)).unwrap(); return { data: data as SiteSetting, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as SiteSetting | null, error: { message } }; }
  },
  async update(key: string, body: UpsertSettingBody) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.updateSiteSettingAdmin.initiate({ key, body })).unwrap(); return { data: data as SiteSetting, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as SiteSetting | null, error: { message } }; }
  },
  async remove(key: string) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.deleteSiteSettingAdmin.initiate(key)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async bulkUpsert(items: BulkUpsertBody["items"]) {
    try { const data = await store.dispatch(siteSettingsAdminApi.endpoints.bulkUpsertSiteSettingsAdmin.initiate({ items })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
};

export type { SiteSetting, ListParams, UpsertSettingBody, BulkUpsertBody };
