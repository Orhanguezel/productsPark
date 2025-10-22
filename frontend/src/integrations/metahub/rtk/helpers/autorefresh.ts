// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/helpers/autorefresh.ts
// -------------------------------------------------------------
import { setupListeners } from "@reduxjs/toolkit/query";

/** setupListeners için dispatch parametresini doğru tiplemenin en sağlam yolu */
type SetupDispatch = Parameters<typeof setupListeners>[0];

export function enableAutoRefetch(dispatch: SetupDispatch) {
  // SSR'da window yokken dinleyici kurmaya çalışma
  if (typeof window === "undefined") return;
  setupListeners(dispatch); // default davranış: focus & reconnect'te refetch
}
