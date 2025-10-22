
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/options.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  optionsAdminApi,
  type Option,
  type ListParams,
  type UpsertOptionBody,
} from "@/integrations/metahub/rtk/endpoints/admin/options_admin.endpoints";

export const optionsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.listOptionsAdmin.initiate(params)).unwrap(); return { data: data as Option[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Option[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.getOptionAdminById.initiate(id)).unwrap(); return { data: data as Option, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Option | null, error: { message } }; }
  },
  async create(body: UpsertOptionBody) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.createOptionAdmin.initiate(body)).unwrap(); return { data: data as Option, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Option | null, error: { message } }; }
  },
  async update(id: string, body: UpsertOptionBody) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.updateOptionAdmin.initiate({ id, body })).unwrap(); return { data: data as Option, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Option | null, error: { message } }; }
  },
  async remove(id: string) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.deleteOptionAdmin.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.reorderOptionsAdmin.initiate(items)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async setActive(id: string, is_active: boolean) {
    try { const data = await store.dispatch(optionsAdminApi.endpoints.toggleActiveOptionAdmin.initiate({ id, is_active })).unwrap(); return { data: data as Option, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Option | null, error: { message } }; }
  },
};

export type { Option, ListParams, UpsertOptionBody };