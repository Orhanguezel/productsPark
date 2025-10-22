
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/payments/client.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { paymentProvidersApi, type PaymentProvider } from "@/integrations/metahub/rtk/endpoints/payment_providers.endpoints";
import { paymentSessionsApi, type PaymentSession, type CreateSessionBody } from "@/integrations/metahub/rtk/endpoints/payment_sessions.endpoints";

export type { PaymentProvider, PaymentSession, CreateSessionBody };

export const payments = {
  async providers(params?: Parameters<typeof paymentProvidersApi.endpoints.listPaymentProviders.initiate>[0]) {
    try { const data = await store.dispatch(paymentProvidersApi.endpoints.listPaymentProviders.initiate(params ?? {})).unwrap(); return { data: data as PaymentProvider[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PaymentProvider[] | null, error: { message } }; }
  },
  async createSession(body: CreateSessionBody) {
    try { const data = await store.dispatch(paymentSessionsApi.endpoints.createPaymentSession.initiate(body)).unwrap(); return { data: data as PaymentSession, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PaymentSession | null, error: { message } }; }
  },
  async getSession(id: string) {
    try { const data = await store.dispatch(paymentSessionsApi.endpoints.getPaymentSession.initiate(id)).unwrap(); return { data: data as PaymentSession, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as PaymentSession | null, error: { message } }; }
  },
  async capture(id: string) {
    try { await store.dispatch(paymentSessionsApi.endpoints.capturePaymentSession.initiate({ id })).unwrap(); return { data: { success: true } as const, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null, error: { message } }; }
  },
  async cancel(id: string) {
    try { await store.dispatch(paymentSessionsApi.endpoints.cancelPaymentSession.initiate({ id })).unwrap(); return { data: { success: true } as const, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null, error: { message } }; }
  },
};