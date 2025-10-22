
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useCartsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Cart, CartItem, ListParams, AddItemBody, UpdateItemBody, UpdateCartBody } from "@/integrations/metahub/client/admin/carts";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useCartsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListCartsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useCartDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetCartAdminByIdQuery(id as string, { skip });
  const { data: items } = metahub.api.useListCartItemsAdminQuery(id as string, { skip });
  return { cart: data ?? null, items: items ?? ([] as CartItem[]), isLoading, error, refetch };
}

export function useCartItemsOps(cartId: string | null) {
  const [addMut] = metahub.api.useAddCartItemAdminMutation();
  const [updMut] = metahub.api.useUpdateCartItemAdminMutation();
  const [delMut] = metahub.api.useRemoveCartItemAdminMutation();
  const [clrMut] = metahub.api.useClearCartAdminMutation();

  const addItem = useCallback(async (body: AddItemBody) => {
    if (!cartId) return { ok: false as const };
    try { await addMut({ id: cartId, body }).unwrap(); notifySuccess("Ürün sepete eklendi"); return { ok: true as const }; }
    catch (e) { notifyError("Ürün eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, addMut]);

  const updateItem = useCallback(async (itemId: string, body: UpdateItemBody) => {
    if (!cartId) return { ok: false as const };
    try { await updMut({ id: cartId, item_id: itemId, body }).unwrap(); notifySuccess("Sepet ürünü güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Ürün güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, updMut]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!cartId) return { ok: false as const };
    try { await delMut({ id: cartId, item_id: itemId }).unwrap(); notifySuccess("Sepet ürünü silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Ürün silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, delMut]);

  const clear = useCallback(async () => {
    if (!cartId) return { ok: false as const };
    try { await clrMut(cartId).unwrap(); notifySuccess("Sepet temizlendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sepet temizlenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, clrMut]);

  return { addItem, updateItem, removeItem, clear };
}

export function useCartCouponOps(cartId: string | null) {
  const [applyMut] = metahub.api.useApplyCouponCartAdminMutation();
  const [removeMut] = metahub.api.useRemoveCouponCartAdminMutation();

  const apply = useCallback(async (code: string) => {
    if (!cartId) return { ok: false as const };
    try { await applyMut({ id: cartId, body: { code } }).unwrap(); notifySuccess("Kupon uygulandı"); return { ok: true as const }; }
    catch (e) { notifyError("Kupon uygulanamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, applyMut]);

  const remove = useCallback(async () => {
    if (!cartId) return { ok: false as const };
    try { await removeMut(cartId).unwrap(); notifySuccess("Kupon kaldırıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Kupon kaldırılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, removeMut]);

  return { apply, remove };
}

export function useUpdateCartMeta(cartId: string | null) {
  const [upd] = metahub.api.useUpdateCartAdminMutation();
  const update = useCallback(async (body: UpdateCartBody) => {
    if (!cartId) return { ok: false as const };
    try { await upd({ id: cartId, body }).unwrap(); notifySuccess("Sepet güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sepet güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [cartId, upd]);
  return { update };
}