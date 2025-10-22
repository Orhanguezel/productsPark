
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/payments.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  paymentsAdminApi,
  type Payment,
  type ListParams,
  type CaptureBody,
  type RefundBody,
  type VoidBody,
  type PaymentEvent,
} from "@/integrations/metahub/rtk/endpoints/admin/payments_admin.endpoints";

export const paymentsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.listPaymentsAdmin.initiate(params)).unwrap(); return { data: data as Payment[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.getPaymentAdminById.initiate(id)).unwrap(); return { data: data as Payment, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment | null, error: { message } }; }
  },
  async capture(id: string, body?: CaptureBody) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.capturePaymentAdmin.initiate({ id, body })).unwrap(); return { data: data as Payment, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment | null, error: { message } }; }
  },
  async refund(id: string, body?: RefundBody) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.refundPaymentAdmin.initiate({ id, body })).unwrap(); return { data: data as Payment, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment | null, error: { message } }; }
  },
  async void(id: string, body?: VoidBody) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.voidPaymentAdmin.initiate({ id, body })).unwrap(); return { data: data as Payment, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment | null, error: { message } }; }
  },
  async sync(id: string) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.syncPaymentAdmin.initiate(id)).unwrap(); return { data: data as Payment, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Payment | null, error: { message } }; }
  },
  async events(id: string) {
    try { const data = await store.dispatch(paymentsAdminApi.endpoints.listPaymentEventsAdmin.initiate(id)).unwrap(); return { data: data as PaymentEvent[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PaymentEvent[] | null, error: { message } }; }
  },
};

export type { Payment, ListParams, CaptureBody, RefundBody, VoidBody, PaymentEvent };
