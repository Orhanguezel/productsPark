
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/webhooks.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  webhooksAdminApi,
  type WebhookEndpoint,
  type WebhookEndpointCreate,
  type WebhookEndpointUpdate,
  type RotateSecretResponse,
  type WebhookDelivery,
  type DeliveryListParams,
  type RetryDeliveryBody,
  type TestDeliveryBody,
  type ExportParams,
  type ExportResponse,
  type DeliveryLogEntry,
  type EventTypeDef,
} from "@/integrations/metahub/rtk/endpoints/admin/webhooks_admin.endpoints";

export const webhooksAdmin = {
  // endpoints
  async listEndpoints(params?: Parameters<typeof webhooksAdminApi.endpoints.listWebhookEndpointsAdmin.initiate>[0]) {
    try { const data = await store.dispatch(webhooksAdminApi.endpoints.listWebhookEndpointsAdmin.initiate(params as any)).unwrap(); return { data: data as WebhookEndpoint[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint[] | null, error: { message } }; }
  },
  async getEndpoint(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.getWebhookEndpointAdminById.initiate(id)).unwrap(); return { data: data as WebhookEndpoint, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint | null, error: { message } }; }
  },
  async createEndpoint(body: WebhookEndpointCreate) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.createWebhookEndpointAdmin.initiate(body)).unwrap(); return { data: data as WebhookEndpoint, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint | null, error: { message } }; }
  },
  async updateEndpoint(id: string, body: WebhookEndpointUpdate) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.updateWebhookEndpointAdmin.initiate({ id, body })).unwrap(); return { data: data as WebhookEndpoint, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint | null, error: { message } }; }
  },
  async deleteEndpoint(id: string) {
    try {
      await store.dispatch(webhooksAdminApi.endpoints.deleteWebhookEndpointAdmin.initiate(id)).unwrap(); return { ok: true as const };
    } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
  async pauseEndpoint(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.pauseWebhookEndpointAdmin.initiate(id)).unwrap(); return { data: data as WebhookEndpoint, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint | null, error: { message } }; }
  },
  async resumeEndpoint(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.resumeWebhookEndpointAdmin.initiate(id)).unwrap(); return { data: data as WebhookEndpoint, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookEndpoint | null, error: { message } }; }
  },
  async rotateSecret(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.rotateSecretWebhookEndpointAdmin.initiate(id)).unwrap(); return { data: data as RotateSecretResponse, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as RotateSecretResponse | null, error: { message } }; }
  },
  async testDelivery(id: string, body: TestDeliveryBody) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.testDeliveryWebhookAdmin.initiate({ id, body })).unwrap(); return { data: data as WebhookDelivery, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookDelivery | null, error: { message } }; }
  },

  // deliveries
  async listDeliveries(params?: DeliveryListParams) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.listWebhookDeliveriesAdmin.initiate(params)).unwrap(); return { data: data as WebhookDelivery[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookDelivery[] | null, error: { message } }; }
  },
  async getDelivery(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.getWebhookDeliveryAdminById.initiate(id)).unwrap(); return { data: data as WebhookDelivery, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookDelivery | null, error: { message } }; }
  },
  async retryDelivery(id: string, body?: RetryDeliveryBody) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.retryWebhookDeliveryAdmin.initiate({ id, body })).unwrap(); return { data: data as WebhookDelivery, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as WebhookDelivery | null, error: { message } }; }
  },
  async exportDeliveries(params?: ExportParams) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.exportWebhookDeliveriesAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
  async logs(id: string) {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.getWebhookDeliveryLogsAdmin.initiate(id)).unwrap(); return { data: data as DeliveryLogEntry[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as DeliveryLogEntry[] | null, error: { message } }; }
  },

  // event types
  async eventTypes() {
    try {
      const data = await store.dispatch(webhooksAdminApi.endpoints.listWebhookEventTypesAdmin.initiate()).unwrap(); return { data: data as EventTypeDef[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as EventTypeDef[] | null, error: { message } }; }
  },
};

export type { WebhookEndpoint, WebhookEndpointCreate, WebhookEndpointUpdate, RotateSecretResponse, WebhookDelivery, DeliveryListParams, RetryDeliveryBody, TestDeliveryBody, ExportParams, ExportResponse, DeliveryLogEntry, EventTypeDef };
