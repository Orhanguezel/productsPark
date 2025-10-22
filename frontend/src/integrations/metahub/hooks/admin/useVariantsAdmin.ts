
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useVariantsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Variant, ListParams, UpsertVariantBody } from "@/integrations/metahub/client/admin/variants";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useVariantsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "display_order", order: "asc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);

  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListVariantsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useProductVariants(productId: string) {
  const { data, isLoading, error, refetch } = metahub.api.useListVariantsByProductAdminQuery(productId);
  return { list: data ?? [], isLoading, error, refetch };
}

export function usePersistVariant() {
  const [createV] = metahub.api.useCreateVariantAdminMutation();
  const [updateV] = metahub.api.useUpdateVariantAdminMutation();

  const save = useCallback(async (payload: { id?: string } & UpsertVariantBody) => {
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        const res = await updateV({ id, body }).unwrap();
        notifySuccess("Varyant güncellendi");
        return { ok: true as const, data: res };
      } else {
        const res = await createV(payload).unwrap();
        notifySuccess("Varyant oluşturuldu");
        return { ok: true as const, data: res };
      }
    } catch (e: unknown) {
      notifyError("Varyant kaydedilemedi", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [createV, updateV]);

  return { save };
}

export function useDeleteVariant() {
  const [deleteV] = metahub.api.useDeleteVariantAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await deleteV(id).unwrap(); notifySuccess("Varyant silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Varyant silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [deleteV]);
  return { remove };
}

export function useReorderVariants() {
  const [reorder] = metahub.api.useReorderVariantsAdminMutation();
  const apply = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try { await reorder(items).unwrap(); notifySuccess("Sıralama güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sıralama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [reorder]);
  return { apply };
}

export function useToggleVariantActive() {
  const [toggleActive] = metahub.api.useToggleActiveVariantAdminMutation();
  const setActive = useCallback(async (id: string, is_active: boolean) => {
    try { await toggleActive({ id, is_active }).unwrap(); notifySuccess("Aktiflik güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Aktiflik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleActive]);
  return { setActive };
}