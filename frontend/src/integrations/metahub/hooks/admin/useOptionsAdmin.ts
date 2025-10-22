
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useOptionsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Option, ListParams, UpsertOptionBody } from "@/integrations/metahub/client/admin/options";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useOptionsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "display_order", order: "asc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);

  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListOptionsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePersistOption() {
  const [createO] = metahub.api.useCreateOptionAdminMutation();
  const [updateO] = metahub.api.useUpdateOptionAdminMutation();

  const save = useCallback(async (payload: { id?: string } & UpsertOptionBody) => {
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        const res = await updateO({ id, body }).unwrap();
        notifySuccess("Seçenek güncellendi");
        return { ok: true as const, data: res };
      } else {
        const res = await createO(payload).unwrap();
        notifySuccess("Seçenek oluşturuldu");
        return { ok: true as const, data: res };
      }
    } catch (e: unknown) {
      notifyError("Seçenek kaydedilemedi", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [createO, updateO]);

  return { save };
}

export function useDeleteOption() {
  const [deleteO] = metahub.api.useDeleteOptionAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await deleteO(id).unwrap(); notifySuccess("Seçenek silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Seçenek silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [deleteO]);
  return { remove };
}

export function useReorderOptions() {
  const [reorder] = metahub.api.useReorderOptionsAdminMutation();
  const apply = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try { await reorder(items).unwrap(); notifySuccess("Sıralama güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sıralama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [reorder]);
  return { apply };
}

export function useToggleOptionActive() {
  const [toggleActive] = metahub.api.useToggleActiveOptionAdminMutation();
  const setActive = useCallback(async (id: string, is_active: boolean) => {
    try { await toggleActive({ id, is_active }).unwrap(); notifySuccess("Aktiflik güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Aktiflik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleActive]);
  return { setActive };
}