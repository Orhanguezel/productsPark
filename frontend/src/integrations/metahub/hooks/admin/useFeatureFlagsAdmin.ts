
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useFeatureFlagsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { FeatureFlag, FlagListParams, CreateFlagBody, UpdateFlagBody, EvaluateResult, Experiment, ExperimentListParams, CreateExperimentBody, UpdateExperimentBody } from "@/integrations/metahub/client/admin/flags";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

// ---- Flags ----
export function useFeatureFlagsAdmin(initial: FlagListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<FlagListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListFeatureFlagsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<FlagListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as FeatureFlag[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useFeatureFlagDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetFeatureFlagAdminByIdQuery(id as string, { skip });
  return { flag: (data ?? null) as FeatureFlag | null, isLoading, error, refetch };
}

export function useCreateFeatureFlag() {
  const [mut] = metahub.api.useCreateFeatureFlagAdminMutation();
  const createFlag = useCallback(async (body: CreateFlagBody) => {
    try { const res = await mut(body).unwrap(); notifySuccess("Feature flag eklendi"); return { ok: true as const, id: res.id };
    } catch (e) { notifyError("Feature flag eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { createFlag };
}

export function useUpdateFeatureFlag() {
  const [mut] = metahub.api.useUpdateFeatureFlagAdminMutation();
  const updateFlag = useCallback(async (id: string, body: UpdateFlagBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Güncellendi"); return { ok: true as const };
    } catch (e) { notifyError("Güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateFlag };
}

export function useDeleteFeatureFlag() {
  const [mut] = metahub.api.useDeleteFeatureFlagAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Silindi"); return { ok: true as const };
    } catch (e) { notifyError("Silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { remove };
}

export function useToggleFeatureFlag() {
  const [mut] = metahub.api.useToggleFeatureFlagAdminMutation();
  const toggle = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Durum değiştirildi"); return { ok: true as const };
    } catch (e) { notifyError("İşlem başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { toggle };
}

export function useEvaluateFeatureFlag() {
  const [mut] = metahub.api.useEvaluateFeatureFlagAdminMutation();
  const evaluate = useCallback(async (key: string, attrs?: Record<string, unknown>): Promise<EvaluateResult | null> => {
    try { const res = await mut({ key, body: { attributes: attrs } }).unwrap(); return res as EvaluateResult; }
    catch (e) { notifyError("Evaluate başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { evaluate };
}

export function useUpdateFlagTraffic() {
  const [mut] = metahub.api.useUpdateFeatureFlagTrafficAdminMutation();
  const updateTraffic = useCallback(async (id: string, variants: FeatureFlag["variants"]) => {
    try { await mut({ id, body: { variants } }).unwrap(); notifySuccess("Trafik dağılımı güncellendi"); return { ok: true as const };
    } catch (e) { notifyError("Trafik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateTraffic };
}

// ---- Experiments ----
export function useExperimentsAdmin(initial: ExperimentListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ExperimentListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListExperimentsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<ExperimentListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Experiment[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useExperimentDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetExperimentAdminByIdQuery(id as string, { skip });
  return { experiment: (data ?? null) as Experiment | null, isLoading, error, refetch };
}

export function useCreateExperiment() {
  const [mut] = metahub.api.useCreateExperimentAdminMutation();
  const createExperiment = useCallback(async (body: CreateExperimentBody) => {
    try { const res = await mut(body).unwrap(); notifySuccess("Deney oluşturuldu"); return { ok: true as const, id: res.id };
    } catch (e) { notifyError("Deney oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { createExperiment };
}

export function useUpdateExperiment() {
  const [mut] = metahub.api.useUpdateExperimentAdminMutation();
  const updateExperiment = useCallback(async (id: string, body: UpdateExperimentBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Deney güncellendi"); return { ok: true as const };
    } catch (e) { notifyError("Güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateExperiment };
}

export function useExperimentLifecycle() {
  const [start] = metahub.api.useStartExperimentAdminMutation();
  const [pause] = metahub.api.usePauseExperimentAdminMutation();
  const [stop] = metahub.api.useStopExperimentAdminMutation();
  const [archive] = metahub.api.useArchiveExperimentAdminMutation();
  const startExp = useCallback(async (id: string) => { try { await start(id).unwrap(); notifySuccess("Başlatıldı"); return { ok: true as const }; } catch (e) { notifyError("Başlatılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [start]);
  const pauseExp = useCallback(async (id: string) => { try { await pause(id).unwrap(); notifySuccess("Duraklatıldı"); return { ok: true as const }; } catch (e) { notifyError("Duraklatılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [pause]);
  const stopExp  = useCallback(async (id: string) => { try { await stop(id).unwrap(); notifySuccess("Durduruldu"); return { ok: true as const }; } catch (e) { notifyError("Durdurulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [stop]);
  const archiveExp = useCallback(async (id: string) => { try { await archive(id).unwrap(); notifySuccess("Arşivlendi"); return { ok: true as const }; } catch (e) { notifyError("Arşivlenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [archive]);
  return { startExp, pauseExp, stopExp, archiveExp };
}

export function useUpdateExperimentTraffic() {
  const [mut] = metahub.api.useUpdateExperimentTrafficAdminMutation();
  const updateTraffic = useCallback(async (id: string, variants: Experiment["variants"]) => {
    try { await mut({ id, body: { variants } }).unwrap(); notifySuccess("Deney trafiği güncellendi"); return { ok: true as const };
    } catch (e) { notifyError("Trafik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateTraffic };
}

export function useExperimentAssignments(id: string | null, page = 0, size = 20) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useListExperimentAssignmentsAdminQuery({ id: id as string, limit: size, offset: page * size }, { skip });
  return { list: (data ?? []) as import("@/integrations/metahub/client/admin/flags").Assignment[], isLoading, error, refetch };
}

export function useExperimentMetrics(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetExperimentMetricsSummaryAdminQuery(id as string, { skip });
  const [exportMut] = metahub.api.useExportExperimentMetricsAdminMutation();
  const exportFile = useCallback(async (format: "csv" | "xlsx" = "xlsx") => { if (!id) return null; try { const res = await exportMut({ id, format }).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; } catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; } }, [exportMut, id]);
  return { summary: (data ?? null) as import("@/integrations/metahub/client/admin/flags").MetricsSummary | null, isLoading, error, refetch, exportFile };
}
