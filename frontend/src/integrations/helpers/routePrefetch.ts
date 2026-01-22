
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/helpers/routePrefetch.ts
// -------------------------------------------------------------
import { store } from "@/store";

export type PrefetchTask = () => void | Promise<void>;
export type PrefetchConfig = Record<string, PrefetchTask[]>; // routeId → tasks

export async function runPrefetch(tasks: PrefetchTask[]): Promise<void> {
  for (const t of tasks) { try { await t(); } catch { /* ignore */ } }
}

// Example usage:
// runPrefetch([
//   () => store.dispatch(ordersApi.endpoints.listOrders.initiate({ limit: 20 })).unwrap(),
// ]);
