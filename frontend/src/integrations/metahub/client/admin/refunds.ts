
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/refunds.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  refundsAdminApi,
  type Refund,
  type RefundEvent,
  type ListParams,
  type ApproveRefundBody,
  type RejectRefundBody,
  type CompleteRefundBody,
  type ExportParams,
  type ExportResponse,
  type OpenChargebackBody,
  type ResolveChargebackBody,
} from "@/integrations/metahub/rtk/endpoints/admin/refunds_admin.endpoints";

export const refundsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.listRefundsAdmin.initiate(params)).unwrap(); return { data: data as Refund[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.getRefundAdminById.initiate(id)).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async approve(id: string, body?: ApproveRefundBody) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.approveRefundAdmin.initiate({ id, body })).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async reject(id: string, body: RejectRefundBody) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.rejectRefundAdmin.initiate({ id, body })).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async complete(id: string, body?: CompleteRefundBody) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.completeRefundAdmin.initiate({ id, body })).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async cancel(id: string) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.cancelRefundAdmin.initiate(id)).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async events(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.listRefundEventsAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as RefundEvent[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as RefundEvent[] | null, error: { message } }; }
  },
  async export(params?: ExportParams) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.exportRefundsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
  async openChargeback(id: string, body?: OpenChargebackBody) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.openChargebackAdmin.initiate({ id, body })).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
  async resolveChargeback(id: string, body: ResolveChargebackBody) {
    try { const data = await store.dispatch(refundsAdminApi.endpoints.resolveChargebackAdmin.initiate({ id, body })).unwrap(); return { data: data as Refund, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Refund | null, error: { message } }; }
  },
};

export type { Refund, RefundEvent, ListParams, ApproveRefundBody, RejectRefundBody, CompleteRefundBody, ExportParams, ExportResponse, OpenChargebackBody, ResolveChargebackBody };
