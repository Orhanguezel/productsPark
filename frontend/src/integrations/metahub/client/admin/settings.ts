
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/settings.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { settingsAdminApi, type Setting, type SettingsListParams, type UpsertSettingBody, type BulkUpsertSettingsBody, type ImportSettingsBody, type ExportResponse } from "@/integrations/metahub/rtk/endpoints/settings_admin.endpoints";

export const settingsAdmin = {
  async list(params?: SettingsListParams) { try { const d = await store.dispatch(settingsAdminApi.endpoints.listSettingsAdmin.initiate(params)).unwrap(); return { data: d as Setting[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Setting[] | null, error: { message } }; } },
  async get(key: string) { try { const d = await store.dispatch(settingsAdminApi.endpoints.getSettingAdmin.initiate(key)).unwrap(); return { data: d as Setting, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Setting | null, error: { message } }; } },
  async upsert(body: UpsertSettingBody) { try { const d = await store.dispatch(settingsAdminApi.endpoints.upsertSettingAdmin.initiate(body)).unwrap(); return { data: d as Setting, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Setting | null, error: { message } }; } },
  async bulkUpsert(body: BulkUpsertSettingsBody) { try { const d = await store.dispatch(settingsAdminApi.endpoints.bulkUpsertSettingsAdmin.initiate(body)).unwrap(); return { data: d as { updated: number }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { updated: number } | null, error: { message } }; } },
  async remove(key: string) { try { await store.dispatch(settingsAdminApi.endpoints.deleteSettingAdmin.initiate(key)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; } },
  async import(body: ImportSettingsBody) { try { const d = await store.dispatch(settingsAdminApi.endpoints.importSettingsAdmin.initiate(body)).unwrap(); return { data: d as { imported: number }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { imported: number } | null, error: { message } }; } },
  async export(params?: SettingsListParams) { try { const d = await store.dispatch(settingsAdminApi.endpoints.exportSettingsAdmin.initiate(params)).unwrap(); return { data: d as ExportResponse, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; } },
};

export type { Setting, SettingsListParams, UpsertSettingBody };
