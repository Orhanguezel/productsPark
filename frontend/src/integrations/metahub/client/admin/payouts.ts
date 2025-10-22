
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/payouts.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  payoutsAdminApi,
  type Payout,
  type PayoutListParams,
  type ApprovePayoutBody,
  type DenyPayoutBody,
  type ExecutePayoutBody,
  type RetryPayoutBody,
  type CancelPayoutBody,
  type PayoutBatch,
  type CreateBatchBody,
  type PayoutsExportParams,
  type ExportResponse,
} from "@/integrations/metahub/rtk/endpoints/admin/payouts_admin.endpoints";

export const payoutsAdmin = {
  async list(params?: PayoutListParams) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.listPayoutsAdmin.initiate(params)).unwrap(); return { data: data as Payout[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.getPayoutAdminById.initiate(id)).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async approve(id: string, body?: ApprovePayoutBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.approvePayoutAdmin.initiate({ id, body })).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async deny(id: string, body?: DenyPayoutBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.denyPayoutAdmin.initiate({ id, body })).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async execute(id: string, body?: ExecutePayoutBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.executePayoutAdmin.initiate({ id, body })).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async retry(id: string, body?: RetryPayoutBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.retryPayoutAdmin.initiate({ id, body })).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async cancel(id: string, body?: CancelPayoutBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.cancelPayoutAdmin.initiate({ id, body })).unwrap(); return { data: data as Payout, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout | null, error: { message } }; }
  },
  async export(params?: PayoutsExportParams) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.exportPayoutsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
  async createBatch(body: CreateBatchBody) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.createPayoutBatchAdmin.initiate(body)).unwrap(); return { data: data as PayoutBatch, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PayoutBatch | null, error: { message } }; }
  },
  async getBatch(id: string) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.getPayoutBatchAdmin.initiate(id)).unwrap(); return { data: data as PayoutBatch, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PayoutBatch | null, error: { message } }; }
  },
  async listBatchItems(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.listPayoutBatchItemsAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as Payout[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payout[] | null, error: { message } }; }
  },
  async finalizeBatch(id: string) {
    try { const data = await store.dispatch(payoutsAdminApi.endpoints.finalizePayoutBatchAdmin.initiate(id)).unwrap(); return { data: data as PayoutBatch, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PayoutBatch | null, error: { message } }; }
  },
};

export type { Payout, PayoutListParams, PayoutBatch, CreateBatchBody, ApprovePayoutBody, DenyPayoutBody, ExecutePayoutBody, RetryPayoutBody, CancelPayoutBody, PayoutsExportParams, ExportResponse };
