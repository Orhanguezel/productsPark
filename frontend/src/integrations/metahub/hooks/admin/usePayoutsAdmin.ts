
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/usePayoutsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Payout, PayoutListParams, PayoutBatch, CreateBatchBody, ExportResponse } from "@/integrations/metahub/client/admin/payouts";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function usePayoutsAdmin(initial: PayoutListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<PayoutListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListPayoutsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<PayoutListParams["sort"]>, order: NonNullable<PayoutListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<PayoutListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePayoutDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetPayoutAdminByIdQuery(id as string, { skip });
  return { payout: (data ?? null) as Payout | null, isLoading, error, refetch };
}

export function useApprovePayout() {
  const [mut] = metahub.api.useApprovePayoutAdminMutation();
  const approve = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Ödeme onaylandı"); return { ok: true as const }; }
    catch (e) { notifyError("Ödeme onaylanamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { approve };
}

export function useDenyPayout() {
  const [mut] = metahub.api.useDenyPayoutAdminMutation();
  const deny = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Ödeme reddedildi"); return { ok: true as const }; }
    catch (e) { notifyError("Ödeme reddedilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { deny };
}

export function useExecutePayout() {
  const [mut] = metahub.api.useExecutePayoutAdminMutation();
  const executeNow = useCallback(async (id: string) => {
    try { await mut({ id, body: { force: true } }).unwrap(); notifySuccess("Ödeme yürütülüyor"); return { ok: true as const }; }
    catch (e) { notifyError("Ödeme yürütülemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { executeNow };
}

export function useRetryPayout() {
  const [mut] = metahub.api.useRetryPayoutAdminMutation();
  const retry = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Ödeme yeniden denenecek"); return { ok: true as const }; }
    catch (e) { notifyError("Yeniden deneme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { retry };
}

export function useCancelPayout() {
  const [mut] = metahub.api.useCancelPayoutAdminMutation();
  const cancel = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); notifySuccess("Ödeme iptal edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Ödeme iptal edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { cancel };
}

export function useExportPayouts() {
  const [mut] = metahub.api.useExportPayoutsAdminMutation();
  const exportFile = useCallback(async (params?: PayoutsExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}

export function usePayoutBatch(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetPayoutBatchAdminQuery(id as string, { skip });
  const { data: items } = metahub.api.useListPayoutBatchItemsAdminQuery(id ? { id } : { id: "" }, { skip });
  return { batch: (data ?? null) as PayoutBatch | null, items: (items ?? []) as Payout[], isLoading, error, refetch };
}

export function useCreatePayoutBatch() {
  const [mut] = metahub.api.useCreatePayoutBatchAdminMutation();
  const createBatch = useCallback(async (body: CreateBatchBody) => {
    try { const res = await mut(body).unwrap(); notifySuccess("Toplu ödeme oluşturuldu"); return { ok: true as const, id: res.id };
    } catch (e) { notifyError("Toplu ödeme oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const };
    }
  }, [mut]);
  return { createBatch };
}

export function useFinalizePayoutBatch() {
  const [mut] = metahub.api.useFinalizePayoutBatchAdminMutation();
  const finalize = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Toplu ödeme finalize edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Finalize edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { finalize };
}
