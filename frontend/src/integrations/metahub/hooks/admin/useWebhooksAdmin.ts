
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useWebhooksAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { WebhookEndpoint, WebhookEndpointCreate, WebhookEndpointUpdate, WebhookDelivery, DeliveryListParams, ExportParams, ExportResponse } from "@/integrations/metahub/client/admin/webhooks";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

// ----- Endpoints list -----
export function useWebhookEndpointsAdmin(initial: { q?: string; is_active?: boolean; limit?: number; offset?: number } = { limit: 20, offset: 0 }) {
  const [params, setParams] = useState(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListWebhookEndpointsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<typeof initial>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as WebhookEndpoint[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useWebhookEndpointDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetWebhookEndpointAdminByIdQuery(id as string, { skip });
  return { endpoint: (data ?? null) as WebhookEndpoint | null, isLoading, error, refetch };
}

export function useCreateWebhookEndpoint() {
  const [mut] = metahub.api.useCreateWebhookEndpointAdminMutation();
  const createEndpoint = useCallback(async (body: WebhookEndpointCreate) => {
    try { const res = await mut(body).unwrap(); notifySuccess("Webhook eklendi"); return { ok: true as const, id: res.id };
    } catch (e) { notifyError("Webhook eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { createEndpoint };
}

export function useUpdateWebhookEndpoint() {
  const [mut] = metahub.api.useUpdateWebhookEndpointAdminMutation();
  const updateEndpoint = useCallback(async (id: string, body: WebhookEndpointUpdate) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Webhook güncellendi"); return { ok: true as const };
    } catch (e) { notifyError("Güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateEndpoint };
}

export function useDeleteWebhookEndpoint() {
  const [mut] = metahub.api.useDeleteWebhookEndpointAdminMutation();
  const deleteEndpoint = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Webhook silindi"); return { ok: true as const };
    } catch (e) { notifyError("Silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { deleteEndpoint };
}

export function useToggleWebhookEndpoint() {
  const [pause] = metahub.api.usePauseWebhookEndpointAdminMutation();
  const [resume] = metahub.api.useResumeWebhookEndpointAdminMutation();
  const toggle = useCallback(async (endpoint: WebhookEndpoint) => {
    try {
      if (endpoint.is_active) { await pause(endpoint.id).unwrap(); notifySuccess("Webhook durduruldu"); }
      else { await resume(endpoint.id).unwrap(); notifySuccess("Webhook aktifleştirildi"); }
      return { ok: true as const };
    } catch (e) {
      notifyError("İşlem başarısız", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [pause, resume]);
  return { toggle };
}

export function useRotateWebhookSecret() {
  const [mut] = metahub.api.useRotateSecretWebhookEndpointAdminMutation();
  const rotate = useCallback(async (id: string) => {
    try { const res = await mut(id).unwrap(); notifySuccess("Gizli anahtar yenilendi"); return { ok: true as const, secret: res.secret };
    } catch (e) { notifyError("Yenilenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const };
    }
  }, [mut]);
  return { rotate };
}

export function useTestWebhookDelivery() {
  const [mut] = metahub.api.useTestDeliveryWebhookAdminMutation();
  const test = useCallback(async (id: string, event_type: string, payload?: Record<string, unknown>) => {
    try { await mut({ id, body: { event_type, payload } }).unwrap(); notifySuccess("Test olayı gönderildi"); return { ok: true as const };
    } catch (e) { notifyError("Test başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { test };
}

// ----- Deliveries -----
export function useWebhookDeliveriesAdmin(initial: DeliveryListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<DeliveryListParams>(initial);
  const { data, isLoading, error, refetch } = metahub.api.useListWebhookDeliveriesAdminQuery(params);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<DeliveryListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as WebhookDelivery[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useWebhookDeliveryDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetWebhookDeliveryAdminByIdQuery(id as string, { skip });
  const { data: logs } = metahub.api.useGetWebhookDeliveryLogsAdminQuery(id as string, { skip });
  return { delivery: (data ?? null) as WebhookDelivery | null, logs: (logs ?? []) as import("@/integrations/metahub/client/admin/webhooks").DeliveryLogEntry[], isLoading, error, refetch };
}

export function useRetryWebhookDelivery() {
  const [mut] = metahub.api.useRetryWebhookDeliveryAdminMutation();
  const retry = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Teslimat yeniden denenecek"); return { ok: true as const };
    } catch (e) { notifyError("Yeniden deneme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { retry };
}

export function useExportWebhookDeliveries() {
  const [mut] = metahub.api.useExportWebhookDeliveriesAdminMutation();
  const exportFile = useCallback(async (params?: ExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}