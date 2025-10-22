
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useAuditAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { AuditLog, AuditListParams, ConfigChange, ConfigListParams, ConfigDiff, ExportResponse } from "@/integrations/metahub/client/admin/audit";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

// ---- Audit Logs ----
export function useAuditLogsAdmin(initial: AuditListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<AuditListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListAuditLogsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<AuditListParams["sort"]>, order: NonNullable<AuditListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<AuditListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as AuditLog[], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useAuditLogDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetAuditLogAdminByIdQuery(id as string, { skip });
  return { item: (data ?? null) as AuditLog | null, isLoading, error, refetch };
}

export function useExportAuditLogs() {
  const [mut] = metahub.api.useExportAuditLogsAdminMutation();
  const exportFile = useCallback(async (params?: AuditListParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Audit dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}

// ---- Config History ----
export function useConfigHistoryAdmin(initial: ConfigListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ConfigListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListConfigHistoryAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ConfigListParams["sort"]>, order: NonNullable<ConfigListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ConfigListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as ConfigChange[], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useConfigChangeDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetConfigChangeAdminByIdQuery(id as string, { skip });
  const { data: diff } = metahub.api.useGetConfigChangeDiffAdminQuery(id as string, { skip });
  return { change: (data ?? null) as ConfigChange | null, diff: (diff ?? null) as ConfigDiff | null, isLoading, error, refetch };
}

export function useRevertConfigChange() {
  const [mut] = metahub.api.useRevertConfigChangeAdminMutation();
  const revert = useCallback(async (id: string, reason?: string) => {
    try { await mut({ id, body: { reason } }).unwrap(); notifySuccess("Değişiklik geri alındı"); return { ok: true as const }; }
    catch (e) { notifyError("Geri alma başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { revert };
}

export function useExportConfigHistory() {
  const [mut] = metahub.api.useExportConfigHistoryAdminMutation();
  const exportFile = useCallback(async (params?: ConfigListParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Config dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}
