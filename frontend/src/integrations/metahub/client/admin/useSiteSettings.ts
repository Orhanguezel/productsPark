
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useSiteSettings.ts
// -------------------------------------------------------------
import { useCallback } from "react";
import { metahub } from "@/integrations/metahub/client";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";
import type { SiteSetting } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

export function useSiteSettings(prefix?: string) {
  const { data, error, isLoading, refetch } = metahub.api.useListSiteSettingsQuery(prefix ? { prefix } : undefined);
  return { settings: data ?? [], error, isLoading, refetch };
}

export function useSaveSettings() {
  const save = useCallback(async (items: Array<{ key: string; value: SiteSetting["value"] }>) => {
    const { data, error } = await metahub.admin.siteSettings.setMany(items);
    if (error) { notifyError("Ayarlar kaydedilemedi", undefined, error.message); return { ok: false as const }; }
    notifySuccess("Ayarlar kaydedildi");
    return { ok: true as const, data };
  }, []);
  return { save };
}