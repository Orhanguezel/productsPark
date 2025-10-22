
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/usePromotionsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub as mh } from "@/integrations/metahub/client";
import type { Promotion, PromotionListParams, CreatePromotionBody, UpdatePromotionBody, PromotionsExportParams, ExportResponse as ExportResponseP } from "@/integrations/metahub/client/admin/promotions";
import { notifyError as nErr, notifySuccess as nOk } from "@/integrations/metahub/ui/toast/helpers";

export function usePromotionsAdmin(initial: PromotionListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<PromotionListParams>(initial);
  const q = mh.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = mh.api.useListPromotionsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<PromotionListParams["sort"]>, order: NonNullable<PromotionListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<PromotionListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePromotionDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = mh.api.useGetPromotionAdminByIdQuery(id as string, { skip });
  return { promotion: data ?? null, isLoading, error, refetch };
}

export function useCreatePromotion() {
  const [mut] = mh.api.useCreatePromotionAdminMutation();
  const create = useCallback(async (body: CreatePromotionBody) => {
    try { await mut(body).unwrap(); nOk("Promosyon oluşturuldu"); return { ok: true as const }; }
    catch (e) { nErr("Promosyon oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { create };
}

export function useUpdatePromotion() {
  const [mut] = mh.api.useUpdatePromotionAdminMutation();
  const update = useCallback(async (id: string, body: UpdatePromotionBody) => {
    try { await mut({ id, body }).unwrap(); nOk("Promosyon güncellendi"); return { ok: true as const }; }
    catch (e) { nErr("Promosyon güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { update };
}

export function useTogglePromotion() {
  const [mut] = mh.api.useTogglePromotionAdminMutation();
  const toggle = useCallback(async (id: string, active: boolean) => {
    try { await mut({ id, active }).unwrap(); nOk(active ? "Promosyon aktifleştirildi" : "Promosyon pasifleştirildi"); return { ok: true as const }; }
    catch (e) { nErr("İşlem başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { toggle };
}

export function useExportPromotions() {
  const [mut] = mh.api.useExportPromotionsAdminMutation();
  const exportFile = useCallback(async (params?: PromotionsExportParams): Promise<ExportResponseP | null> => {
    try { const res = await mut(params).unwrap(); nOk("Dışa aktarma hazır"); return res; }
    catch (e) { nErr("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}
