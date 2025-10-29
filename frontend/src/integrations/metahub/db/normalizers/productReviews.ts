// =============================================================
// FILE: src/integrations/metahub/db/normalizers/productReviews.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, toBool } from "../../core/normalize";

export function normalizeProductReviewRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        if ("rating" in c) c.rating = toNumber(c.rating);

        if ("is_approved" in c && c.is_active === undefined) {
            const b = toBool(c.is_approved);
            if (b !== undefined) c.is_active = b;
        } else if ("is_active" in c) {
            const b = toBool(c.is_active);
            if (b !== undefined) c.is_active = b;
        }
        return c as UnknownRow;
    });
}
