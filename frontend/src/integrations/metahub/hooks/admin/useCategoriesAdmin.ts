
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useCategoriesAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Category, ListParams, UpsertCategoryBody } from "@/integrations/metahub/client/admin/categories";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useCategoriesAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "display_order", order: "asc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);

  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListCategoriesAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePersistCategory() {
  const [createC] = metahub.api.useCreateCategoryAdminMutation();
  const [updateC] = metahub.api.useUpdateCategoryAdminMutation();

  const save = useCallback(async (payload: { id?: string } & UpsertCategoryBody) => {
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        const res = await updateC({ id, body }).unwrap();
        notifySuccess("Kategori güncellendi");
        return { ok: true as const, data: res };
      } else {
        const res = await createC(payload).unwrap();
        notifySuccess("Kategori oluşturuldu");
        return { ok: true as const, data: res };
      }
    } catch (e: unknown) {
      notifyError("Kategori kaydedilemedi", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [createC, updateC]);

  return { save };
}

export function useDeleteCategory() {
  const [deleteC] = metahub.api.useDeleteCategoryAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await deleteC(id).unwrap(); notifySuccess("Kategori silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Kategori silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [deleteC]);
  return { remove };
}

export function useReorderCategories() {
  const [reorder] = metahub.api.useReorderCategoriesAdminMutation();
  const apply = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try { await reorder(items).unwrap(); notifySuccess("Sıralama güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sıralama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [reorder]);
  return { apply };
}

export function useToggleCategoryFlags() {
  const [toggleActive] = metahub.api.useToggleActiveCategoryAdminMutation();
  const [toggleFeatured] = metahub.api.useToggleFeaturedCategoryAdminMutation();

  const setActive = useCallback(async (id: string, is_active: boolean) => {
    try { await toggleActive({ id, is_active }).unwrap(); notifySuccess("Aktiflik güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Aktiflik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleActive]);

  const setFeatured = useCallback(async (id: string, is_featured: boolean) => {
    try { await toggleFeatured({ id, is_featured }).unwrap(); notifySuccess("Öne çıkarma güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Öne çıkarma güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleFeatured]);

  return { setActive, setFeatured };
}
