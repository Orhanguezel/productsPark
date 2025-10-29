// =============================================================
// FILE: src/integrations/metahub/db/normalizers/apiProviders.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeApiProviderRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        c.is_active =
            c.is_active === true || c.is_active === 1 || c.is_active === "1" || c.is_active === "true";
        return c as UnknownRow;
    });
}
