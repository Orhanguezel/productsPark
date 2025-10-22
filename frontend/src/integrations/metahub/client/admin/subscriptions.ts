
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/subscriptions.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  subscriptionsAdminApi,
  type Subscription,
  type Plan,
  type InvoiceSummary,
  type UsageRecord,
  type ListParams,
  type PauseBody,
  type CancelBody,
  type ChangePlanBody,
  type AddUsageBody,
  type RetryPaymentBody,
  type ExportParams,
  type ExportResponse,
  type SubscriptionEvent,
} from "@/integrations/metahub/rtk/endpoints/admin/subscriptions_admin.endpoints";

export const subscriptionsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.listSubscriptionsAdmin.initiate(params)).unwrap(); return { data: data as Subscription[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.getSubscriptionAdminById.initiate(id)).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async pause(id: string, body?: PauseBody) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.pauseSubscriptionAdmin.initiate({ id, body })).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async resume(id: string) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.resumeSubscriptionAdmin.initiate(id)).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async cancel(id: string, body?: CancelBody) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.cancelSubscriptionAdmin.initiate({ id, body })).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async changePlan(id: string, body: ChangePlanBody) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.changePlanSubscriptionAdmin.initiate({ id, body })).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async retryPayment(id: string, body?: RetryPaymentBody) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.retryPaymentSubscriptionAdmin.initiate({ id, body })).unwrap(); return { data: data as Subscription, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Subscription | null, error: { message } }; }
  },
  async invoices(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.listSubscriptionInvoicesAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as InvoiceSummary[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as InvoiceSummary[] | null, error: { message } }; }
  },
  async usage(id: string, meter?: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.listSubscriptionUsageAdmin.initiate({ id, meter, limit, offset })).unwrap(); return { data: data as UsageRecord[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as UsageRecord[] | null, error: { message } }; }
  },
  async addUsage(id: string, body: AddUsageBody) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.addSubscriptionUsageAdmin.initiate({ id, body })).unwrap(); return { data: data as UsageRecord, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as UsageRecord | null, error: { message } }; }
  },
  async events(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.listSubscriptionEventsAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as SubscriptionEvent[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as SubscriptionEvent[] | null, error: { message } }; }
  },
  async export(params?: ExportParams) {
    try { const data = await store.dispatch(subscriptionsAdminApi.endpoints.exportSubscriptionsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
};

export type { Subscription, Plan, InvoiceSummary, UsageRecord, ListParams, PauseBody, CancelBody, ChangePlanBody, AddUsageBody, RetryPaymentBody, ExportParams, ExportResponse, SubscriptionEvent };
