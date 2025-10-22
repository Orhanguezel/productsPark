

// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/health/client.ts
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { healthApi, type Health } from "@/integrations/metahub/rtk/endpoints/health.endpoints";

export type { Health };

export const health = {
  async check() {
    try { const data = await store.dispatch(healthApi.endpoints.getHealth.initiate()).unwrap(); return { data: data as Health, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Health | null, error: { message } }; }
  },
};
