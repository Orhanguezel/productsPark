// =============================================================
// FILE: src/integrations/metahub/db/from/constants.ts
// =============================================================

/** BASE URL */
const RAW_BASE_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_METAHUB_URL as string | undefined) ||
    ""
  ).replace(/\/+$/, "");

export const BASE_URL = RAW_BASE_URL;
export const EDGE_URL = BASE_URL;
export const APP_URL = BASE_URL;
