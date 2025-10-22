
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useDisputesAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub as mh } from "@/integrations/metahub/client";
import type { Dispute, DisputeListParams, DisputeNote, DisputeEvidenceFile, AssignDisputeBody, SubmitEvidenceBody, DisputesExportParams, ExportResponse2 } from "@/integrations/metahub/client/admin/disputes";
import { notifyError as nErr, notifySuccess as nOk } from "@/integrations/metahub/ui/toast/helpers";

export function useDisputesAdmin(initial: DisputeListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<DisputeListParams>(initial);
  const q = mh.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = mh.api.useListDisputesAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<DisputeListParams["sort"]>, order: NonNullable<DisputeListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<DisputeListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useDisputeDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = mh.api.useGetDisputeAdminByIdQuery(id as string, { skip });
  const { data: evidence } = mh.api.useListDisputeEvidenceAdminQuery(id ? { id } : { id: "" }, { skip });
  const { data: notes } = mh.api.useListDisputeNotesAdminQuery(id ? { id } : { id: "" }, { skip });
  return { dispute: data ?? null, evidence: (evidence ?? []) as DisputeEvidenceFile[], notes: (notes ?? []) as DisputeNote[], isLoading, error, refetch };
}

export function useAssignDispute() {
  const [mut] = mh.api.useAssignDisputeAdminMutation();
  const assign = useCallback(async (id: string, body: AssignDisputeBody) => {
    try { await mut({ id, body }).unwrap(); nOk("Atama güncellendi"); return { ok: true as const }; }
    catch (e) { nErr("Atama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { assign };
}

export function useSubmitEvidence() {
  const [mut] = mh.api.useSubmitDisputeEvidenceAdminMutation();
  const submit = useCallback(async (id: string, body: SubmitEvidenceBody) => {
    try { await mut({ id, body }).unwrap(); nOk("Delil gönderildi"); return { ok: true as const }; }
    catch (e) { nErr("Delil gönderilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { submit };
}

export function useDeleteEvidence() {
  const [mut] = mh.api.useDeleteDisputeEvidenceAdminMutation();
  const remove = useCallback(async (id: string, evidence_id: string) => {
    try { await mut({ id, evidence_id }).unwrap(); nOk("Delil silindi"); return { ok: true as const }; }
    catch (e) { nErr("Delil silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { remove };
}

export function useFinalizeDispute() {
  const [mut] = mh.api.useFinalizeDisputeAdminMutation();
  const finalize = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); nOk("İtiraz tamamlandı"); return { ok: true as const }; }
    catch (e) { nErr("İtiraz tamamlanamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { finalize };
}

export function useAcceptDispute() {
  const [mut] = mh.api.useAcceptDisputeAdminMutation();
  const accept = useCallback(async (id: string, reason?: string | null) => {
    try { await mut({ id, reason }).unwrap(); nOk("İtiraz kabul edildi"); return { ok: true as const }; }
    catch (e) { nErr("İtiraz kabul edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { accept };
}

export function useAddDisputeNote() {
  const [mut] = mh.api.useAddDisputeNoteAdminMutation();
  const addNote = useCallback(async (id: string, message: string, visibility: "internal" | "public" = "internal") => {
    try { await mut({ id, message, visibility }).unwrap(); nOk("Not eklendi"); return { ok: true as const }; }
    catch (e) { nErr("Not eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { addNote };
}

export function useExportDisputes() {
  const [mut] = mh.api.useExportDisputesAdminMutation();
  const exportFile = useCallback(async (params?: DisputesExportParams): Promise<ExportResponse2 | null> => {
    try { const res = await mut(params).unwrap(); nOk("Dışa aktarma hazır"); return res; }
    catch (e) { nErr("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}