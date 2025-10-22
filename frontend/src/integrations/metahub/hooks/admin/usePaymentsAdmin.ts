
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/usePaymentsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Payment, ListParams, CaptureBody, RefundBody, VoidBody, PaymentEvent } from "@/integrations/metahub/client/admin/payments";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function usePaymentsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListPaymentsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePaymentDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetPaymentAdminByIdQuery(id as string, { skip });
  const { data: events } = metahub.api.useListPaymentEventsAdminQuery(id as string, { skip });
  return { payment: data ?? null, events: events ?? ([] as PaymentEvent[]), isLoading, error, refetch };
}

export function useCapturePayment() {
  const [mut] = metahub.api.useCapturePaymentAdminMutation();
  const capture = useCallback(async (id: string, body?: CaptureBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Ödeme capture edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Capture başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { capture };
}

export function useRefundPayment() {
  const [mut] = metahub.api.useRefundPaymentAdminMutation();
  const refund = useCallback(async (id: string, body?: RefundBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("İade işlemi uygulandı"); return { ok: true as const }; }
    catch (e) { notifyError("İade başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { refund };
}

export function useVoidPayment() {
  const [mut] = metahub.api.useVoidPaymentAdminMutation();
  const voidPayment = useCallback(async (id: string, body?: VoidBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Ödeme void edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Void başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { voidPayment };
}

export function useSyncPayment() {
  const [mut] = metahub.api.useSyncPaymentAdminMutation();
  const sync = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Gateway ile senkronize edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Senkronizasyon başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { sync };
}
