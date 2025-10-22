
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useSubscriptionsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Subscription, ListParams, PauseBody, CancelBody, ChangePlanBody, AddUsageBody, InvoiceSummary, UsageRecord, SubscriptionEvent, ExportParams, ExportResponse } from "@/integrations/metahub/client/admin/subscriptions";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useSubscriptionsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListSubscriptionsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useSubscriptionDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetSubscriptionAdminByIdQuery(id as string, { skip });
  const { data: invoices } = metahub.api.useListSubscriptionInvoicesAdminQuery(id ? { id } : { id: "" }, { skip });
  const { data: events } = metahub.api.useListSubscriptionEventsAdminQuery(id ? { id } : { id: "" }, { skip });
  return { subscription: data ?? null, invoices: (invoices ?? []) as InvoiceSummary[], events: (events ?? []) as SubscriptionEvent[], isLoading, error, refetch };
}

export function usePauseSubscription() {
  const [mut] = metahub.api.usePauseSubscriptionAdminMutation();
  const pause = useCallback(async (id: string, body?: PauseBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Abonelik duraklatıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Abonelik duraklatılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { pause };
}

export function useResumeSubscription() {
  const [mut] = metahub.api.useResumeSubscriptionAdminMutation();
  const resume = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Abonelik devam ettirildi"); return { ok: true as const }; }
    catch (e) { notifyError("Abonelik devam ettirilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { resume };
}

export function useCancelSubscription() {
  const [mut] = metahub.api.useCancelSubscriptionAdminMutation();
  const cancel = useCallback(async (id: string, body?: CancelBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Abonelik iptal edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Abonelik iptal edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { cancel };
}

export function useChangePlan() {
  const [mut] = metahub.api.useChangePlanSubscriptionAdminMutation();
  const changePlan = useCallback(async (id: string, body: ChangePlanBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Paket değiştirildi"); return { ok: true as const }; }
    catch (e) { notifyError("Paket değiştirilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { changePlan };
}

export function useRetryPayment() {
  const [mut] = metahub.api.useRetryPaymentSubscriptionAdminMutation();
  const retry = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Ödeme yeniden denendi"); return { ok: true as const }; }
    catch (e) { notifyError("Ödeme yeniden denenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { retry };
}

export function useUsageAdmin(subId: string | null, meter?: string) {
  const skip = !subId;
  const { data, isLoading, error, refetch } = metahub.api.useListSubscriptionUsageAdminQuery(subId ? { id: subId, meter } : { id: "", meter }, { skip });
  const [mut] = metahub.api.useAddSubscriptionUsageAdminMutation();

  const add = useCallback(async (body: AddUsageBody) => {
    if (!subId) return { ok: false as const };
    try { await mut({ id: subId, body }).unwrap(); notifySuccess("Kullanım kaydı eklendi"); refetch(); return { ok: true as const }; }
    catch (e) { notifyError("Kullanım kaydı eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut, refetch, subId]);

  return { usage: (data ?? []) as UsageRecord[], isLoading, error, refetch, add };
}

export function useExportSubscriptions() {
  const [mut] = metahub.api.useExportSubscriptionsAdminMutation();
  const exportFile = useCallback(async (params?: ExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}
