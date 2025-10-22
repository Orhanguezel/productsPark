
// -------------------------------------------------------------
// FILE: src/integrations/metahub/feature-flags/featureFlags.ts
// -------------------------------------------------------------
import { store } from "@/store";
import { siteSettingsApi } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

export type Flags = Record<string, boolean>;
let cache: Flags | null = null;

export async function loadFlags(): Promise<Flags> {
  try {
    const data = await store.dispatch(siteSettingsApi.endpoints.getSiteSettingByKey.initiate("feature_flags")).unwrap();
    const flags = (data?.value ?? {}) as Flags;
    cache = flags; return flags;
  } catch {
    cache = cache ?? {}; return cache;
  }
}

export function getFlag(key: string, def = false): boolean { return cache?.[key] ?? def; }
export function getFlags(): Flags { return cache ?? {}; }
