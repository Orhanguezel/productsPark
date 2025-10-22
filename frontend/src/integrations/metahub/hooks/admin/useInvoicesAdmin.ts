
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useInvoicesAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Invoice, ListParams, CreateInvoiceBody, UpdateInvoiceBody, MarkPaidBody, SendEmailBody, PdfResponse, ExportParams, ExportResponse } from "@/integrations/metahub/client/admin/invoices";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useInvoicesAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListInvoicesAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useInvoiceDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetInvoiceAdminByIdQuery(id as string, { skip });
  return { invoice: data ?? null, isLoading, error, refetch };
}

export function useCreateInvoice() {
  const [mut] = metahub.api.useCreateInvoiceAdminMutation();
  const create = useCallback(async (body: CreateInvoiceBody) => {
    try { await mut(body).unwrap(); notifySuccess("Fatura oluşturuldu"); return { ok: true as const }; }
    catch (e) { notifyError("Fatura oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { create };
}

export function useUpdateInvoice() {
  const [mut] = metahub.api.useUpdateInvoiceAdminMutation();
  const update = useCallback(async (id: string, body: UpdateInvoiceBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Fatura güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Fatura güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { update };
}

export function useMarkInvoicePaid() {
  const [mut] = metahub.api.useMarkInvoicePaidAdminMutation();
  const markPaid = useCallback(async (id: string, body?: MarkPaidBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Fatura ödendi olarak işaretlendi"); return { ok: true as const }; }
    catch (e) { notifyError("Fatura işaretlenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { markPaid };
}

export function useSendInvoiceEmail() {
  const [mut] = metahub.api.useSendInvoiceEmailAdminMutation();
  const send = useCallback(async (id: string, body?: SendEmailBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Fatura e-posta ile gönderildi"); return { ok: true as const }; }
    catch (e) { notifyError("E-posta gönderilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { send };
}

export function useInvoicePdf() {
  const [mut] = metahub.api.useGetInvoicePdfAdminMutation();
  const getPdf = useCallback(async (id: string): Promise<PdfResponse | null> => {
    try { const res = await mut({ id }).unwrap(); notifySuccess("PDF hazır"); return res; }
    catch (e) { notifyError("PDF alınamadı", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { getPdf };
}

export function useExportInvoices() {
  const [mut] = metahub.api.useExportInvoicesAdminMutation();
  const exportFile = useCallback(async (params?: ExportParams): Promise<ExportResponse | null> => {
    try { const res = await mut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return res; }
    catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; }
  }, [mut]);
  return { exportFile };
}
