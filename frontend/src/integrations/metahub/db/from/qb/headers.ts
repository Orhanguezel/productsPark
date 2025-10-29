// =============================================================
// FILE: src/integrations/metahub/db/from/qb/headers.ts
// =============================================================
import { buildAuthHeaders } from "../http";
import type { SelectOpts } from "../types";

export function getHeadersForSelect(selectOpts: SelectOpts): HeadersInit {
  const headers = buildAuthHeaders();
  if (selectOpts?.count) {
    (headers as Record<string, string>)["Prefer"] = `count=${selectOpts.count}`;
  }
  return headers;
}

// (Opsiyonel) Başka yerlerde default import yapıldıysa kırmamak için:
export default getHeadersForSelect;
