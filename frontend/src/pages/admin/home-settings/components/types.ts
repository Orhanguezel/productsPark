// =============================================================
// FILE: src/pages/admin/home-settings/types.ts
// =============================================================
import type { HomeSettings } from "./config";

export type HomeSettingsSectionProps = {
  settings: HomeSettings;
  onChange: (patch: Partial<HomeSettings>) => void;
};
