
// -------------------------------------------------------------
// FILE: src/integrations/metahub/qa/checklist.ts — QA runner
// -------------------------------------------------------------
import { health } from "@/integrations/metahub/client/health/client";
import { siteSettingsApi } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import { productsApi } from "@/integrations/metahub/rtk/endpoints/products.endpoints"; // guard in try
import { store } from "@/store";

export type QaItem = { name: string; ok: boolean; detail?: string };
export type QaReport = { startedAt: string; items: QaItem[]; ok: boolean };

export async function runQaChecklist(): Promise<QaReport> {
  const startedAt = new Date().toISOString();
  const items: QaItem[] = [];

  // 1) Health
  try {
    const r = await health.check();
    items.push({ name: "health", ok: !!r.data?.ok, detail: r.data?.ok ? "ok" : r.error?.message ?? "fail" });
  } catch (e) { items.push({ name: "health", ok: false, detail: String(e) }); }

  // 2) Site settings (feature_flags)
  try {
    const data = await store.dispatch(siteSettingsApi.endpoints.getSiteSettingByKey.initiate("feature_flags")).unwrap();
    const hasObj = !!data && typeof data.value === "object";
    items.push({ name: "site_settings:feature_flags", ok: hasObj, detail: hasObj ? "ok" : "missing" });
  } catch { items.push({ name: "site_settings:feature_flags", ok: false, detail: "request_failed" }); }

  // 3) Products list smoke (if api exists)
  try {
    if (productsApi) {
      const data = await store.dispatch(productsApi.endpoints.listProducts.initiate({ limit: 1 })).unwrap();
      const ok = Array.isArray(data);
      items.push({ name: "products:list", ok, detail: ok ? `count=${data.length}` : "invalid" });
    }
  } catch { items.push({ name: "products:list", ok: false, detail: "request_failed" }); }

  const ok = items.every((i) => i.ok);
  return { startedAt, items, ok };
}
