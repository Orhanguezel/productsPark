
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useCampaignsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Campaign, CampaignUsage, ListParams, CreateCampaignBody, UpdateCampaignBody, PreviewBody, PreviewResult } from "@/integrations/metahub/client/admin/campaigns";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useCampaignsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListCampaignsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useCampaignDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetCampaignAdminByIdQuery(id as string, { skip });
  const { data: usages } = metahub.api.useListCampaignUsagesAdminQuery(id ? { id } : { id: "" }, { skip });
  return { campaign: data ?? null, usages: usages ?? ([] as CampaignUsage[]), isLoading, error, refetch };
}

export function useCreateCampaign() {
  const [mut] = metahub.api.useCreateCampaignAdminMutation();
  const create = useCallback(async (body: CreateCampaignBody) => {
    try { await mut(body).unwrap(); notifySuccess("Kampanya oluşturuldu"); return { ok: true as const }; }
    catch (e) { notifyError("Kampanya oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { create };
}

export function useUpdateCampaign() {
  const [mut] = metahub.api.useUpdateCampaignAdminMutation();
  const update = useCallback(async (id: string, body: UpdateCampaignBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Kampanya güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Kampanya güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { update };
}

export function useToggleCampaign() {
  const [mut] = metahub.api.useToggleCampaignAdminMutation();
  const toggle = useCallback(async (id: string, is_active: boolean) => {
    try { await mut({ id, body: { is_active } }).unwrap(); notifySuccess(is_active ? "Kampanya aktif edildi" : "Kampanya pasifleştirildi"); return { ok: true as const }; }
    catch (e) { notifyError("Kampanya durumu değiştirilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { toggle };
}

export function useDeleteCampaign() {
  const [mut] = metahub.api.useDeleteCampaignAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Kampanya silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Kampanya silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { remove };
}

export function usePreviewCampaign() {
  const [mut] = metahub.api.usePreviewCampaignAdminMutation();
  const preview = useCallback(async (id: string, body: PreviewBody): Promise<PreviewResult | null> => {
    try { const res = await mut({ id, body }).unwrap(); return res; }
    catch (e) { notifyError("Önizleme başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { preview };
}