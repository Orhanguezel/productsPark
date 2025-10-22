

// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useSettingsAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState, useEffect } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Setting, SettingsListParams, UpsertSettingBody } from "@/integrations/metahub/client/admin/settings";
import { notifySuccess, notifyError } from "@/integrations/metahub/ui/toast/helpers";

export function useSiteSettingsAdmin(initial: SettingsListParams = { limit: 50, offset: 0, sort: "updated_at", order: "desc" }) {
  const [params, setParams] = useState<SettingsListParams>(initial);
  const dq = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = metahub.api.useListSettingsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<SettingsListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Setting[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useSettingAdmin(key: string | null) {
  const skip = !key; const { data, isLoading } = metahub.api.useGetSettingAdminQuery(key as string, { skip });
  return { item: (data ?? null) as Setting | null, isLoading };
}

export function useSettingMutations() {
  const [upsertMut] = metahub.api.useUpsertSettingAdminMutation();
  const [deleteMut] = metahub.api.useDeleteSettingAdminMutation();
  const upsert = async (body: UpsertSettingBody) => { try { await upsertMut(body).unwrap(); notifySuccess("Ayar kaydedildi"); return { ok: true as const }; } catch (e) { notifyError("Ayar kaydedilemedi"); return { ok: false as const }; } };
  const remove = async (key: string) => { try { await deleteMut(key).unwrap(); notifySuccess("Ayar silindi"); return { ok: true as const }; } catch (e) { notifyError("Ayar silinemedi"); return { ok: false as const }; } };
  return { upsert, remove };
}

// Realtime subscription for specific keys or a prefix
export function useSettingsRealtime({ keys, prefix }: { keys?: string[]; prefix?: string }) {
  const [changedKey, setChangedKey] = useState<string | null>(null);
  useEffect(() => {
    const channel = metahub
      .channel("site-settings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload: unknown) => {
        const k = (payload as { new?: { key?: string }; old?: { key?: string } })?.new?.key || (payload as { old?: { key?: string } })?.old?.key;
        if (!k) return;
        if (keys && keys.length > 0 && !keys.includes(k)) return;
        if (prefix && !k.startsWith(prefix)) return;
        setChangedKey(k);
      })
      .subscribe();
    return () => { metahub.removeChannel(channel); };
  }, [JSON.stringify(keys), prefix]);

  return { changedKey };
}
