
// FILE: src/integrations/metahub/client/admin/promotions.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as normalizeError2 } from "@/integrations/metahub/core/errors";
import {
  promotionsAdminApi,
  type Promotion,
  type PromotionListParams,
  type CreatePromotionBody,
  type UpdatePromotionBody,
  type PromotionsExportParams,
  type ExportResponse as ExportResponse2,
} from "@/integrations/metahub/rtk/endpoints/admin/promotions_admin.endpoints";

export const promotionsAdmin = {
  async list(params?: PromotionListParams) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.listPromotionsAdmin.initiate(params)).unwrap(); return { data: data as Promotion[], error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Promotion[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.getPromotionAdminById.initiate(id)).unwrap(); return { data: data as Promotion, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Promotion | null, error: { message } }; }
  },
  async create(body: CreatePromotionBody) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.createPromotionAdmin.initiate(body)).unwrap(); return { data: data as Promotion, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Promotion | null, error: { message } }; }
  },
  async update(id: string, body: UpdatePromotionBody) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.updatePromotionAdmin.initiate({ id, body })).unwrap(); return { data: data as Promotion, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Promotion | null, error: { message } }; }
  },
  async toggle(id: string, active: boolean) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.togglePromotionAdmin.initiate({ id, active })).unwrap(); return { data: data as Promotion, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as Promotion | null, error: { message } }; }
  },
  async export(params?: PromotionsExportParams) {
    try { const data = await store2.dispatch(promotionsAdminApi.endpoints.exportPromotionsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse2, error: null as null }; }
    catch (e) { const { message } = normalizeError2(e); return { data: null as ExportResponse2 | null, error: { message } }; }
  },
};

export type { Promotion, PromotionListParams, CreatePromotionBody, UpdatePromotionBody, PromotionsExportParams };
