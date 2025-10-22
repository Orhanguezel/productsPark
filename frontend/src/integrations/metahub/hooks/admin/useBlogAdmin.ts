
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useBlogAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { BlogPost, ListParams, UpsertBlogBody } from "@/integrations/metahub/client/admin/blog";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useBlogAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);

  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListBlogPostsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePersistBlogPost() {
  const [createP] = metahub.api.useCreateBlogPostAdminMutation();
  const [updateP] = metahub.api.useUpdateBlogPostAdminMutation();

  const save = useCallback(async (payload: { id?: string } & UpsertBlogBody) => {
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        const res = await updateP({ id, body }).unwrap();
        notifySuccess("Blog yazısı güncellendi");
        return { ok: true as const, data: res };
      } else {
        const res = await createP(payload).unwrap();
        notifySuccess("Blog yazısı oluşturuldu");
        return { ok: true as const, data: res };
      }
    } catch (e: unknown) {
      notifyError("Blog yazısı kaydedilemedi", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [createP, updateP]);

  return { save };
}

export function useDeleteBlogPost() {
  const [deleteP] = metahub.api.useDeleteBlogPostAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await deleteP(id).unwrap(); notifySuccess("Blog yazısı silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Blog yazısı silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [deleteP]);
  return { remove };
}

export function useReorderBlogPosts() {
  const [reorder] = metahub.api.useReorderBlogPostsAdminMutation();
  const apply = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try { await reorder(items).unwrap(); notifySuccess("Sıralama güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sıralama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [reorder]);
  return { apply };
}

export function useTogglePublishBlogPost() {
  const [toggle] = metahub.api.useTogglePublishBlogPostAdminMutation();
  const setPublished = useCallback(async (id: string, is_published: boolean) => {
    try { await toggle({ id, is_published }).unwrap(); notifySuccess(is_published ? "Yayınlandı" : "Taslağa alındı"); return { ok: true as const }; }
    catch (e) { notifyError("Yayın durumu güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggle]);
  return { setPublished };
}