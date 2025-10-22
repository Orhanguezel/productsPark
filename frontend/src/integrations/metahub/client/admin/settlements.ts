
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/settlements.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as nErr } from "@/integrations/metahub/core/errors";
import {
  settlementsAdminApi,
  type Settlement,
  type SettlementListParams,
  type SettlementLine,
  type RegenerateSettlementBody,
  type SettlementsExportParams,
  type ExportResponse2,
} from "@/integrations/metahub/rtk/endpoints/admin/settlements_admin.endpoints";

export const settlementsAdmin = {
  async list(params?: SettlementListParams) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.listSettlementsAdmin.initiate(params)).unwrap(); return { data: data as Settlement[], error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as Settlement[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.getSettlementAdminById.initiate(id)).unwrap(); return { data: data as Settlement, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as Settlement | null, error: { message } }; }
  },
  async lines(id: string, limit?: number, offset?: number) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.listSettlementLinesAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as SettlementLine[], error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as SettlementLine[] | null, error: { message } }; }
  },
  async finalize(id: string) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.finalizeSettlementAdmin.initiate(id)).unwrap(); return { data: data as Settlement, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as Settlement | null, error: { message } }; }
  },
  async regenerate(id: string, body?: RegenerateSettlementBody) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.regenerateSettlementAdmin.initiate({ id, body })).unwrap(); return { data: data as Settlement, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as Settlement | null, error: { message } }; }
  },
  async export(params?: SettlementsExportParams) {
    try { const data = await store2.dispatch(settlementsAdminApi.endpoints.exportSettlementsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse2, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as ExportResponse2 | null, error: { message } }; }
  },
};

export type { Settlement, SettlementListParams, SettlementLine, RegenerateSettlementBody, SettlementsExportParams, ExportResponse2 };
