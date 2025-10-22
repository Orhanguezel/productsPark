
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useSiteSettingsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { SiteSetting, ListParams, UpsertSettingBody } from "@/integrations/metahub/client/admin/siteSettings";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useSiteSettingsAdmin(initial: ListParams = { limit: 100, offset: 0, sort: "key", order: "asc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);

  const { data, isLoading, error, refetch } = metahub.api.useListSiteSettingsAdminQuery(merged);
  const map = useMemo(() => {
    const out = new Map<string, SiteSetting>();
    for (const s of data ?? []) out.set(s.key, s);
    return out;
  }, [data]);

  const setPage = (page: number, size = params.limit ?? 100) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], map, isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePersistSiteSetting() {
  const [create] = metahub.api.useCreateSiteSettingAdminMutation();
  const [update] = metahub.api.useUpdateSiteSettingAdminMutation();

  const save = useCallback(async (payload: { key: string } & Omit<UpsertSettingBody, "key">) => {
    try {
      const { key, ...body } = payload;
      // optimistic: try update first, fallback create on 404-like errors is BE-specific; we use explicit update path.
      const res = await update({ key, body: { key, ...body } }).unwrap();
      notifySuccess("Ayar güncellendi");
      return { ok: true as const, data: res };
    } catch (e) {
      try {
        const res = await create({ key: payload.key, ...payload }).unwrap();
        notifySuccess("Ayar oluşturuldu");
        return { ok: true as const, data: res };
      } catch (err) {
        notifyError("Ayar kaydedilemedi", undefined, err instanceof Error ? err.message : String(err));
        return { ok: false as const };
      }
    }
  }, [create, update]);

  return { save };
}

export function useBulkUpsertSiteSettings() {
  const [bulk] = metahub.api.useBulkUpsertSiteSettingsAdminMutation();
  const apply = useCallback(async (items: Array<UpsertSettingBody>) => {
    try { await bulk({ items }).unwrap(); notifySuccess("Ayarlar güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Ayarlar güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [bulk]);
  return { apply };
}

export function useDeleteSiteSetting() {
  const [delMut] = metahub.api.useDeleteSiteSettingAdminMutation();
  const remove = useCallback(async (key: string) => {
    try { await delMut(key).unwrap(); notifySuccess("Ayar silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Ayar silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [delMut]);
  return { remove };
}