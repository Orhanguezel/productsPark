// =============================================================
// FILE: src/integrations/metahub/db/normalizers/footerSections.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toBool } from "../../core/normalize";

export function normalizeFooterSectionRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        if (typeof c.title !== "string") c.title = String(c.title ?? "");

        const n = Number(c.display_order as unknown);
        c.display_order = Number.isFinite(n) ? n : 0;

        const b = toBool(c.is_active);
        c.is_active = b === undefined ? false : b;

        return c as UnknownRow;
    });
}
