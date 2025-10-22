
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useMediaAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub as m } from "@/integrations/metahub/client";
import type { MediaAsset, MediaListParams, UpdateAssetBody } from "@/integrations/metahub/client/admin/media";
import { notifySuccess as ok, notifyError as fail } from "@/integrations/metahub/ui/toast/helpers";

export function useMediaLibrary(initial: MediaListParams = { limit: 40, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<MediaListParams>(initial);
  const dq = m.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = m.api.useListMediaAssetsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 40) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<MediaListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as MediaAsset[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useUploadAsset() {
  const [mut] = m.api.useUploadMediaAssetAdminMutation();
  const upload = async (file: File, folder?: string | null, metadata?: Record<string, string> | null) => {
    try { await mut({ file, folder: folder ?? null, metadata: metadata ?? null }).unwrap(); ok("Yüklendi"); return { ok: true as const }; }
    catch (e) { fail("Yükleme başarısız"); return { ok: false as const }; }
  };
  return { upload };
}

export function useUpdateAsset() {
  const [mut] = m.api.useUpdateMediaAssetAdminMutation();
  const update = async (id: string, body: UpdateAssetBody) => {
    try { await mut({ id, body }).unwrap(); ok("Güncellendi"); return { ok: true as const }; }
    catch (e) { fail("Güncellenemedi"); return { ok: false as const }; }
  };
  return { update };
}

export function useDeleteAsset() {
  const [mut] = m.api.useDeleteMediaAssetAdminMutation();
  const remove = async (id: string) => { try { await mut(id).unwrap(); ok("Silindi"); return { ok: true as const }; } catch { fail("Silinemedi"); return { ok: false as const }; } };
  return { remove };
}

export function useSignedUrl() {
  const [mut] = m.api.useGetSignedUrlMediaAdminMutation();
  const getUrl = async (id: string, variant?: "original" | "thumb" | "webp") => {
    try { const res = await mut({ id, variant }).unwrap(); return { url: res.url, expires_at: res.expires_at }; }
    catch { return { url: "", expires_at: null }; }
  };
  return { getUrl };
}
