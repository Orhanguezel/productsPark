
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useSettlementsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub as mh } from "@/integrations/metahub/client";
import type { Settlement, SettlementListParams, SettlementLine, ExportResponse2 } from "@/integrations/metahub/client/admin/settlements";
import { notifyError as nErr2, notifySuccess as nOk2 } from "@/integrations/metahub/ui/toast/helpers";

export function useSettlementsAdmin(initial: SettlementListParams = { limit: 20, offset: 0, sort: "period_end", order: "desc" }) {
  const [params, setParams] = useState<SettlementListParams>(initial);
  const q = mh.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = mh.api.useListSettlementsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<SettlementListParams["sort"]>, order: NonNullable<SettlementListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<SettlementListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useSettlementDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = mh.api.useGetSettlementAdminByIdQuery(id as string, { skip });
  const { data: lines } = mh.api.useListSettlementLinesAdminQuery(id ? { id } : { id: "" }, { skip });
  return { settlement: (data ?? null) as Settlement | null, lines: (lines ?? []) as SettlementLine[], isLoading, error, refetch };
}

export function useFinalizeSettlement() {
  const [mut] = mh.api.useFinalizeSettlementAdminMutation();
  const finalize = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); nOk2("Mutabakat finalize edildi"); return { ok: true as const }; }
    catch (e) { nErr2("Finalize edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { finalize };
}

export function useRegenerateSettlement() {
  const [mut] = mh.api.useRegenerateSettlementAdminMutation();
  const regenerate = useCallback(async (id: string) => {
    try { await mut({ id }).unwrap(); nOk2("Mutabakat yeniden oluşturuluyor"); return { ok: true as const }; }
    catch (e) { nErr2("Yeniden oluşturma başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { regenerate };
}

export function useExportSettlements() {
  const [mut] = mh.api.useExportSettlementsAdminMutation();
  const exportFile = useCallback(async (params?: SettlementsExportParams): Promise<ExportResponse2 | null> => {
    try { const res = await mut(params).unwrap(); nOk2("Dışa aktarma hazır"); return res; }
    catch (e) { nErr2("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}