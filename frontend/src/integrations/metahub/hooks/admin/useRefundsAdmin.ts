
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useRefundsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Refund, RefundEvent, ListParams, ApproveRefundBody, RejectRefundBody, CompleteRefundBody, ExportParams, ExportResponse } from "@/integrations/metahub/client/admin/refunds";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useRefundsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListRefundsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useRefundDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetRefundAdminByIdQuery(id as string, { skip });
  const { data: events } = metahub.api.useListRefundEventsAdminQuery(id ? { id } : { id: "" }, { skip });
  return { refund: data ?? null, events: events ?? ([] as RefundEvent[]), isLoading, error, refetch };
}

export function useApproveRefund() {
  const [mut] = metahub.api.useApproveRefundAdminMutation();
  const approve = useCallback(async (id: string, body?: ApproveRefundBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("İade onaylandı"); return { ok: true as const }; }
    catch (e) { notifyError("İade onaylanamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { approve };
}

export function useRejectRefund() {
  const [mut] = metahub.api.useRejectRefundAdminMutation();
  const reject = useCallback(async (id: string, body: RejectRefundBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("İade reddedildi"); return { ok: true as const }; }
    catch (e) { notifyError("İade reddedilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { reject };
}

export function useCompleteRefund() {
  const [mut] = metahub.api.useCompleteRefundAdminMutation();
  const complete = useCallback(async (id: string, body?: CompleteRefundBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("İade tamamlandı"); return { ok: true as const }; }
    catch (e) { notifyError("İade tamamlanamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { complete };
}

export function useCancelRefund() {
  const [mut] = metahub.api.useCancelRefundAdminMutation();
  const cancel = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("İade iptal edildi"); return { ok: true as const }; }
    catch (e) { notifyError("İade iptal edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { cancel };
}

export function useExportRefunds() {
  const [mut] = metahub.api.useExportRefundsAdminMutation();
  const exportFile = useCallback(async (params?: ExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}

export function useChargebackOps() {
  const [openMut] = metahub.api.useOpenChargebackAdminMutation();
  const [resolveMut] = metahub.api.useResolveChargebackAdminMutation();

  const open = useCallback(async (id: string, body?: import("@/integrations/metahub/client/admin/refunds").OpenChargebackBody) => {
    try { await openMut({ id, body }).unwrap(); notifySuccess("Chargeback açıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Chargeback açılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [openMut]);

  const resolve = useCallback(async (id: string, body: import("@/integrations/metahub/client/admin/refunds").ResolveChargebackBody) => {
    try { await resolveMut({ id, body }).unwrap(); notifySuccess("Chargeback sonuçlandı"); return { ok: true as const }; }
    catch (e) { notifyError("Chargeback sonuçlandırılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [resolveMut]);

  return { open, resolve };
}