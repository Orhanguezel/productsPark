
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/webhooks_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : String(x).toLowerCase() === "true" || String(x) === "1");
const asArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

// ----- Types: Endpoints -----
export type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  version: string;                 // e.g. "2024-05-01"
  is_active: boolean;
  secret_last4: string | null;     // last 4 chars for UI
  event_types: string[];           // ["order.created", "refund.approved", ...]
  failure_rate: number;            // 0..1 (fraction) or % depending on BE; we keep as fraction 0..1
  last_delivery_at: string | null; // ISO
  created_at: string;              // ISO
  updated_at: string | null;       // ISO
};

export type ApiWebhookEndpoint = Omit<WebhookEndpoint, "failure_rate" | "is_active"> & {
  is_active: boolean | 0 | 1 | "0" | "1" | string;
  failure_rate: number | string;
};

const normalizeEndpoint = (e: ApiWebhookEndpoint): WebhookEndpoint => ({
  ...e,
  is_active: toBool(e.is_active),
  failure_rate: toNumber(e.failure_rate),
  last_delivery_at: e.last_delivery_at ? toIso(e.last_delivery_at) : null,
  updated_at: e.updated_at ? toIso(e.updated_at) : null,
});

export type WebhookEndpointCreate = {
  name: string;
  url: string;
  version?: string;
  event_types: string[];
  is_active?: boolean;
  secret?: string; // optional manual secret seed
};

export type WebhookEndpointUpdate = Partial<Omit<WebhookEndpointCreate, "event_types">> & {
  event_types?: string[];
};

export type RotateSecretResponse = { secret: string; secret_last4: string; rotated_at: string | null };

// ----- Types: Deliveries -----
export type DeliveryStatus = "pending" | "sent" | "success" | "fail" | "retrying" | "discarded";

export type WebhookDelivery = {
  id: string;
  endpoint_id: string;
  event_type: string;
  status: DeliveryStatus;
  status_code: number | null;
  attempt_count: number;
  max_attempts: number;
  latency_ms: number | null;
  request_body_preview: string | null;  // short snippet for UI
  response_body_preview: string | null; // short snippet for UI
  signature_id: string | null;
  created_at: string;    // ISO
  sent_at: string | null;// ISO
  completed_at: string | null; // ISO
  error_message?: string | null;
};

export type ApiWebhookDelivery = Omit<WebhookDelivery, "attempt_count" | "max_attempts" | "latency_ms"> & {
  attempt_count: number | string;
  max_attempts: number | string;
  latency_ms: number | string | null;
};

const normalizeDelivery = (d: ApiWebhookDelivery): WebhookDelivery => ({
  ...d,
  attempt_count: toNumber(d.attempt_count),
  max_attempts: toNumber(d.max_attempts),
  latency_ms: d.latency_ms == null ? null : toNumber(d.latency_ms),
  sent_at: d.sent_at ? toIso(d.sent_at) : null,
  completed_at: d.completed_at ? toIso(d.completed_at) : null,
});

export type DeliveryListParams = {
  endpoint_id?: string;
  event_type?: string;
  status?: DeliveryStatus;
  since?: string; // ISO
  until?: string; // ISO
  limit?: number; offset?: number;
  sort?: "created_at" | "sent_at" | "completed_at" | "status_code" | "attempt_count";
  order?: "asc" | "desc";
};

export type RetryDeliveryBody = { force?: boolean | 0 | 1 };
export type TestDeliveryBody = { event_type: string; payload?: Record<string, unknown> };
export type ExportParams = DeliveryListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

// ----- Types: Logs & Event Types -----
export type DeliveryLogEntry = { ts: string; level: "debug" | "info" | "warn" | "error"; message: string; ctx?: Record<string, unknown> };
export type ApiDeliveryLogEntry = Omit<DeliveryLogEntry, "ts"> & { ts: string | number | Date };
const normalizeLog = (l: ApiDeliveryLogEntry): DeliveryLogEntry => ({ ...l, ts: toIso(l.ts) ?? new Date(0).toISOString() });

export type EventTypeDef = { name: string; version: string; description?: string | null };

export const webhooksAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---- Endpoints ----
    listWebhookEndpointsAdmin: b.query<WebhookEndpoint[], { q?: string; is_active?: boolean; event_type?: string; limit?: number; offset?: number; sort?: "created_at" | "last_delivery_at" | "failure_rate"; order?: "asc" | "desc" } | void>({
      query: (params) => ({ url: "/webhooks/endpoints", params }),
      transformResponse: (res: unknown): WebhookEndpoint[] => {
        if (Array.isArray(res)) return (res as ApiWebhookEndpoint[]).map(normalizeEndpoint);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiWebhookEndpoint[]).map(normalizeEndpoint) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((e) => ({ type: "WebhookEndpoints" as const, id: e.id })),
        { type: "WebhookEndpoints" as const, id: "LIST" },
      ] : [{ type: "WebhookEndpoints" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getWebhookEndpointAdminById: b.query<WebhookEndpoint, string>({
      query: (id) => ({ url: `/webhooks/endpoints/${id}` }),
      transformResponse: (res: unknown): WebhookEndpoint => normalizeEndpoint(res as ApiWebhookEndpoint),
      providesTags: (_r, _e, id) => [{ type: "WebhookEndpoints", id }],
    }),

    createWebhookEndpointAdmin: b.mutation<WebhookEndpoint, WebhookEndpointCreate>({
      query: (body) => ({ url: "/webhooks/endpoints", method: "POST", body }),
      transformResponse: (res: unknown): WebhookEndpoint => normalizeEndpoint(res as ApiWebhookEndpoint),
      invalidatesTags: [{ type: "WebhookEndpoints" as const, id: "LIST" }],
    }),

    updateWebhookEndpointAdmin: b.mutation<WebhookEndpoint, { id: string; body: WebhookEndpointUpdate }>({
      query: ({ id, body }) => ({ url: `/webhooks/endpoints/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): WebhookEndpoint => normalizeEndpoint(res as ApiWebhookEndpoint),
      invalidatesTags: (_r, _e, arg) => [{ type: "WebhookEndpoints", id: arg.id }, { type: "WebhookEndpoints", id: "LIST" }],
    }),

    deleteWebhookEndpointAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/webhooks/endpoints/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "WebhookEndpoints" as const, id: "LIST" }],
    }),

    pauseWebhookEndpointAdmin: b.mutation<WebhookEndpoint, string>({
      query: (id) => ({ url: `/webhooks/endpoints/${id}/pause`, method: "POST" }),
      transformResponse: (res: unknown): WebhookEndpoint => normalizeEndpoint(res as ApiWebhookEndpoint),
      invalidatesTags: (_r, _e, id) => [{ type: "WebhookEndpoints", id }],
    }),

    resumeWebhookEndpointAdmin: b.mutation<WebhookEndpoint, string>({
      query: (id) => ({ url: `/webhooks/endpoints/${id}/resume`, method: "POST" }),
      transformResponse: (res: unknown): WebhookEndpoint => normalizeEndpoint(res as ApiWebhookEndpoint),
      invalidatesTags: (_r, _e, id) => [{ type: "WebhookEndpoints", id }],
    }),

    rotateSecretWebhookEndpointAdmin: b.mutation<RotateSecretResponse, string>({
      query: (id) => ({ url: `/webhooks/endpoints/${id}/rotate-secret`, method: "POST" }),
      transformResponse: (res: unknown): RotateSecretResponse => {
        const r = res as { secret?: unknown; secret_last4?: unknown; rotated_at?: unknown };
        return {
          secret: String(r?.secret ?? ""),
          secret_last4: String(r?.secret_last4 ?? ""),
          rotated_at: r?.rotated_at ? toIso(r.rotated_at) : null,
        };
      },
      invalidatesTags: [{ type: "WebhookEndpoints" as const, id: "LIST" }],
    }),

    testDeliveryWebhookAdmin: b.mutation<WebhookDelivery, { id: string; body: TestDeliveryBody }>({
      query: ({ id, body }) => ({ url: `/webhooks/endpoints/${id}/test`, method: "POST", body }),
      transformResponse: (res: unknown): WebhookDelivery => normalizeDelivery(res as ApiWebhookDelivery),
      invalidatesTags: [{ type: "WebhookDeliveries" as const, id: "LIST" }],
    }),

    // ---- Deliveries ----
    listWebhookDeliveriesAdmin: b.query<WebhookDelivery[], DeliveryListParams | void>({
      query: (params) => ({ url: "/webhooks/deliveries", params }),
      transformResponse: (res: unknown): WebhookDelivery[] => {
        if (Array.isArray(res)) return (res as ApiWebhookDelivery[]).map(normalizeDelivery);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiWebhookDelivery[]).map(normalizeDelivery) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((d) => ({ type: "WebhookDeliveries" as const, id: d.id })),
        { type: "WebhookDeliveries" as const, id: "LIST" },
      ] : [{ type: "WebhookDeliveries" as const, id: "LIST" }],
    }),

    getWebhookDeliveryAdminById: b.query<WebhookDelivery, string>({
      query: (id) => ({ url: `/webhooks/deliveries/${id}` }),
      transformResponse: (res: unknown): WebhookDelivery => normalizeDelivery(res as ApiWebhookDelivery),
      providesTags: (_r, _e, id) => [{ type: "WebhookDeliveries", id }],
    }),

    retryWebhookDeliveryAdmin: b.mutation<WebhookDelivery, { id: string; body?: RetryDeliveryBody }>({
      query: ({ id, body }) => ({ url: `/webhooks/deliveries/${id}/retry`, method: "POST", body }),
      transformResponse: (res: unknown): WebhookDelivery => normalizeDelivery(res as ApiWebhookDelivery),
      invalidatesTags: (_r, _e, arg) => [{ type: "WebhookDeliveries", id: arg.id }, { type: "WebhookDeliveries", id: "LIST" }],
    }),

    exportWebhookDeliveriesAdmin: b.mutation<ExportResponse, ExportParams | void>({
      query: (params) => ({ url: "/webhooks/deliveries/export", method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
      },
    }),

    getWebhookDeliveryLogsAdmin: b.query<DeliveryLogEntry[], string>({
      query: (id) => ({ url: `/webhooks/deliveries/${id}/logs` }),
      transformResponse: (res: unknown): DeliveryLogEntry[] => asArray<ApiDeliveryLogEntry>(res).map(normalizeLog),
      providesTags: (_r, _e, id) => [{ type: "WebhookDeliveries", id: `LOGS_${id}` }],
    }),

    // ---- Event Types ----
    listWebhookEventTypesAdmin: b.query<EventTypeDef[], void>({
      query: () => ({ url: "/webhooks/event-types" }),
      transformResponse: (res: unknown): EventTypeDef[] => asArray<EventTypeDef>(res),
      providesTags: [{ type: "WebhookEvents" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWebhookEndpointsAdminQuery,
  useGetWebhookEndpointAdminByIdQuery,
  useCreateWebhookEndpointAdminMutation,
  useUpdateWebhookEndpointAdminMutation,
  useDeleteWebhookEndpointAdminMutation,
  usePauseWebhookEndpointAdminMutation,
  useResumeWebhookEndpointAdminMutation,
  useRotateSecretWebhookEndpointAdminMutation,
  useTestDeliveryWebhookAdminMutation,
  useListWebhookDeliveriesAdminQuery,
  useGetWebhookDeliveryAdminByIdQuery,
  useRetryWebhookDeliveryAdminMutation,
  useExportWebhookDeliveriesAdminMutation,
  useGetWebhookDeliveryLogsAdminQuery,
  useListWebhookEventTypesAdminQuery,
} = webhooksAdminApi;