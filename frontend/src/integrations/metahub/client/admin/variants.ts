
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/variants.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  variantsAdminApi,
  type Variant,
  type ListParams,
  type UpsertVariantBody,
} from "@/integrations/metahub/rtk/endpoints/admin/variants_admin.endpoints";

export const variantsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.listVariantsAdmin.initiate(params)).unwrap(); return { data: data as Variant[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant[] | null, error: { message } }; }
  },
  async listByProduct(productId: string) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.listVariantsByProductAdmin.initiate(productId)).unwrap(); return { data: data as Variant[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.getVariantAdminById.initiate(id)).unwrap(); return { data: data as Variant, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant | null, error: { message } }; }
  },
  async create(body: UpsertVariantBody) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.createVariantAdmin.initiate(body)).unwrap(); return { data: data as Variant, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant | null, error: { message } }; }
  },
  async update(id: string, body: UpsertVariantBody) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.updateVariantAdmin.initiate({ id, body })).unwrap(); return { data: data as Variant, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant | null, error: { message } }; }
  },
  async remove(id: string) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.deleteVariantAdmin.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.reorderVariantsAdmin.initiate(items)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async setActive(id: string, is_active: boolean) {
    try { const data = await store.dispatch(variantsAdminApi.endpoints.toggleActiveVariantAdmin.initiate({ id, is_active })).unwrap(); return { data: data as Variant, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant | null, error: { message } }; }
  },
};

export type { Variant, ListParams, UpsertVariantBody };