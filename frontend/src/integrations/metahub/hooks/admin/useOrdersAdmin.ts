
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useOrdersAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Order, ListParams, UpdateStatusBody, RefundBody, CancelBody, FulfillmentBody, OrderTimelineEvent } from "@/integrations/metahub/client/admin/orders";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useOrdersAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListOrdersAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useOrderDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetOrderAdminByIdQuery(id as string, { skip });
  const { data: timeline } = metahub.api.useListOrderTimelineAdminQuery(id as string, { skip });
  return { order: data ?? null, timeline: timeline ?? ([] as OrderTimelineEvent[]), isLoading, error, refetch };
}

export function useUpdateOrderStatus() {
  const [mut] = metahub.api.useUpdateOrderStatusAdminMutation();
  const updateStatus = useCallback(async (id: string, body: UpdateStatusBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Sipariş durumu güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Durum güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { updateStatus };
}

export function useCancelOrder() {
  const [mut] = metahub.api.useCancelOrderAdminMutation();
  const cancel = useCallback(async (id: string, body?: CancelBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Sipariş iptal edildi"); return { ok: true as const }; }
    catch (e) { notifyError("İptal başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { cancel };
}

export function useRefundOrder() {
  const [mut] = metahub.api.useRefundOrderAdminMutation();
  const refund = useCallback(async (id: string, body: RefundBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("İade işlemi uygulandı"); return { ok: true as const }; }
    catch (e) { notifyError("İade başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { refund };
}

export function useUpdateFulfillment() {
  const [mut] = metahub.api.useUpdateOrderFulfillmentAdminMutation();
  const setFulfillment = useCallback(async (id: string, body: FulfillmentBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Kargolama/fulfillment güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Fulfillment güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { setFulfillment };
}

export function useOrderNotes() {
  const [mut] = metahub.api.useAddOrderNoteAdminMutation();
  const addNote = useCallback(async (id: string, message: string) => {
    try { await mut({ id, body: { message } }).unwrap(); notifySuccess("Not eklendi"); return { ok: true as const }; }
    catch (e) { notifyError("Not eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { addNote };
}
/*

/ -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useOrdersAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { OrderAdmin, OrdersAdminListParams } from "@/integrations/metahub/client/admin/orders";
import { notifySuccess, notifyError } from "@/integrations/metahub/ui/toast/helpers";

export function useOrdersAdmin(initial: OrdersAdminListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<OrdersAdminListParams>(initial);
  const dq = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = metahub.api.useListOrdersAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<OrdersAdminListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as OrderAdmin[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useOrderDetail(id: string | null) {
  const skip = !id; const { data, isLoading, refetch } = metahub.api.useGetOrderAdminQuery(id as string, { skip });
  return { item: (data ?? null) as OrderAdmin | null, isLoading, refetch };
}

export function useOrderMutations() {
  const [statusMut] = metahub.api.useUpdateOrderStatusAdminMutation();
  const [cancelMut] = metahub.api.useCancelOrderAdminMutation();
  const [noteMut] = metahub.api.useAddOrderNoteAdminMutation();

  const setStatus = async (id: string, status: "pending" | "paid" | "shipped" | "cancelled" | "refunded", note?: string) => {
    try { await statusMut({ id, status, note }).unwrap(); notifySuccess("Sipariş durumu güncellendi"); return { ok: true as const }; }
    catch { notifyError("Sipariş durumu güncellenemedi"); return { ok: false as const }; }
  };
  const cancel = async (id: string, reason?: string) => {
    try { await cancelMut({ id, reason }).unwrap(); notifySuccess("Sipariş iptal edildi"); return { ok: true as const }; }
    catch { notifyError("Sipariş iptal edilemedi"); return { ok: false as const }; }
  };
  const addNote = async (id: string, note: string) => {
    try { await noteMut({ id, note }).unwrap(); notifySuccess("Not eklendi"); return { ok: true as const }; }
    catch { notifyError("Not eklenemedi"); return { ok: false as const }; }
  };

  return { setStatus, cancel, addNote };
}
*/