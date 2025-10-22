
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useReviewsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Review, ListParams, ReplyBody } from "@/integrations/metahub/client/admin/reviews";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useReviewsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListReviewsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useModerateReview() {
  const [approveMut] = metahub.api.useApproveReviewAdminMutation();
  const [rejectMut] = metahub.api.useRejectReviewAdminMutation();

  const approve = useCallback(async (id: string) => {
    try { await approveMut(id).unwrap(); notifySuccess("İnceleme onaylandı"); return { ok: true as const }; }
    catch (e) { notifyError("Onay başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [approveMut]);

  const reject = useCallback(async (id: string, reason?: string | null) => {
    try { await rejectMut({ id, reason }).unwrap(); notifySuccess("İnceleme reddedildi"); return { ok: true as const }; }
    catch (e) { notifyError("Reddetme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [rejectMut]);

  return { approve, reject };
}

export function useToggleReviewFlags() {
  const [visibleMut] = metahub.api.useToggleVisibleReviewAdminMutation();
  const [pinnedMut] = metahub.api.useTogglePinnedReviewAdminMutation();

  const setVisible = useCallback(async (id: string, is_visible: boolean) => {
    try { await visibleMut({ id, is_visible }).unwrap(); notifySuccess("Görünürlük güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Görünürlük güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [visibleMut]);

  const setPinned = useCallback(async (id: string, is_pinned: boolean) => {
    try { await pinnedMut({ id, is_pinned }).unwrap(); notifySuccess("Sabitlenme güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sabitlenme güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [pinnedMut]);

  return { setVisible, setPinned };
}

export function useDeleteReview() {
  const [delMut] = metahub.api.useDeleteReviewAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await delMut(id).unwrap(); notifySuccess("İnceleme silindi"); return { ok: true as const }; }
    catch (e) { notifyError("İnceleme silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [delMut]);
  return { remove };
}

export function useReplyReview() {
  const [replyMut] = metahub.api.useReplyReviewAdminMutation();
  const send = useCallback(async (id: string, message: string) => {
    try { await replyMut({ id, body: { message } }).unwrap(); notifySuccess("Yanıt gönderildi"); return { ok: true as const }; }
    catch (e) { notifyError("Yanıt gönderilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [replyMut]);
  return { send };
}
