
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/campaigns.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  campaignsAdminApi,
  type Campaign,
  type CampaignUsage,
  type ListParams,
  type CreateCampaignBody,
  type UpdateCampaignBody,
  type ToggleCampaignBody,
  type PreviewBody,
  type PreviewResult,
} from "@/integrations/metahub/rtk/endpoints/admin/campaigns_admin.endpoints";

export const campaignsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.listCampaignsAdmin.initiate(params)).unwrap(); return { data: data as Campaign[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Campaign[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.getCampaignAdminById.initiate(id)).unwrap(); return { data: data as Campaign, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Campaign | null, error: { message } }; }
  },
  async create(body: CreateCampaignBody) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.createCampaignAdmin.initiate(body)).unwrap(); return { data: data as Campaign, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Campaign | null, error: { message } }; }
  },
  async update(id: string, body: UpdateCampaignBody) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.updateCampaignAdmin.initiate({ id, body })).unwrap(); return { data: data as Campaign, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Campaign | null, error: { message } }; }
  },
  async toggle(id: string, is_active: boolean) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.toggleCampaignAdmin.initiate({ id, body: { is_active } })).unwrap(); return { data: data as Campaign, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Campaign | null, error: { message } }; }
  },
  async remove(id: string) {
    try { await store.dispatch(campaignsAdminApi.endpoints.deleteCampaignAdmin.initiate(id)).unwrap(); return { data: { success: true as const }, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { success: true } | null, error: { message } }; }
  },
  async usages(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.listCampaignUsagesAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as CampaignUsage[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as CampaignUsage[] | null, error: { message } }; }
  },
  async preview(id: string, body: PreviewBody) {
    try { const data = await store.dispatch(campaignsAdminApi.endpoints.previewCampaignAdmin.initiate({ id, body })).unwrap(); return { data: data as PreviewResult, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PreviewResult | null, error: { message } }; }
  },
};

export type { Campaign, CampaignUsage, ListParams, CreateCampaignBody, UpdateCampaignBody, ToggleCampaignBody, PreviewBody, PreviewResult };
