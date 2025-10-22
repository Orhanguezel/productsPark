
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/activity/client.ts (Facade)
// -------------------------------------------------------------
import { store as storeA } from "@/store";
import { normalizeError as nErrA } from "@/integrations/metahub/core/errors";
import { activityLogsApi, type ActivityLog } from "@/integrations/metahub/rtk/endpoints/activity_logs.endpoints";

export type { ActivityLog };

export const activity = {
  async list(params?: Parameters<typeof activityLogsApi.endpoints.listActivityLogs.initiate>[0]) {
    try { const data = await storeA.dispatch(activityLogsApi.endpoints.listActivityLogs.initiate(params ?? {})).unwrap(); return { data: data as ActivityLog[], error: null as null }; }
    catch (e) { const { message } = nErrA(e); return { data: null as ActivityLog[] | null, error: { message } }; }
  },
};
