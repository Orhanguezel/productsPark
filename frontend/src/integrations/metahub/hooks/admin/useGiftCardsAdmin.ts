
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useGiftCardsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { GiftCard, GiftCardHistory, ListParams, CreateGiftCardBody, RedeemGiftCardBody } from "@/integrations/metahub/client/admin/giftCards";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useGiftCardsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListGiftCardsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useGiftCardDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetGiftCardAdminByIdQuery(id as string, { skip });
  const { data: history } = metahub.api.useListGiftCardHistoryAdminQuery(id ? { id } : { id: "" }, { skip });
  return { giftCard: data ?? null, history: history ?? ([] as GiftCardHistory[]), isLoading, error, refetch };
}

export function useCreateGiftCard() {
  const [mut] = metahub.api.useCreateGiftCardAdminMutation();
  const create = useCallback(async (body: CreateGiftCardBody) => {
    try { await mut(body).unwrap(); notifySuccess("Hediye kartı oluşturuldu"); return { ok: true as const }; }
    catch (e) { notifyError("Hediye kartı oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { create };
}

export function useActivateGiftCard() {
  const [mut] = metahub.api.useActivateGiftCardAdminMutation();
  const activate = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Hediye kartı aktif edildi"); return { ok: true as const }; }
    catch (e) { notifyError("Hediye kartı aktif edilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { activate };
}

export function useDeactivateGiftCard() {
  const [mut] = metahub.api.useDeactivateGiftCardAdminMutation();
  const deactivate = useCallback(async (id: string) => {
    try { await mut(id).unwrap(); notifySuccess("Hediye kartı pasifleştirildi"); return { ok: true as const }; }
    catch (e) { notifyError("Hediye kartı pasifleştirilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { deactivate };
}

export function useRedeemGiftCard() {
  const [mut] = metahub.api.useRedeemGiftCardAdminMutation();
  const redeem = useCallback(async (id: string, body: RedeemGiftCardBody) => {
    try { await mut({ id, body }).unwrap(); notifySuccess("Hediye kartı kullanıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Hediye kartı kullanılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [mut]);
  return { redeem };
}