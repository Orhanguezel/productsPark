
// -------------------------------------------------------------
// FILE: src/integrations/metahub/feature-flags/
// -------------------------------------------------------------
import { useEffect, useState } from "react";
import { getFlag, loadFlags } from "./featureFlags";

export function useFeatureFlag(key: string, def = false) {
  const [enabled, setEnabled] = useState<boolean>(() => getFlag(key, def));
  useEffect(() => { void loadFlags().then(() => setEnabled(getFlag(key, def))); }, [key, def]);
  return enabled;
}