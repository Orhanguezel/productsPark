// =============================================================
// FILE: src/integrations/metahub/db/normalizers/popups.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, numOrNullish, toBool } from "../../core/normalize";

export function normalizePopupRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        if ("title" in c && c.title != null && typeof c.title !== "string") c.title = String(c.title);
        if ("display_pages" in c && c.display_pages != null && typeof c.display_pages !== "string")
            c.display_pages = String(c.display_pages);
        if ("display_frequency" in c && c.display_frequency != null && typeof c.display_frequency !== "string")
            c.display_frequency = String(c.display_frequency);

        if ("is_active" in c) {
            const b = toBool(c.is_active);
            if (b !== undefined) c.is_active = b;
        }

        if ("delay_seconds" in c) c.delay_seconds = numOrNullish(c.delay_seconds) ?? null;
        if ("duration_seconds" in c) c.duration_seconds = numOrNullish(c.duration_seconds) ?? null;
        if ("priority" in c) c.priority = numOrNullish(c.priority) ?? null;

        if (c.products && typeof c.products === "object") {
            const p = c.products as Record<string, unknown>;
            if ("price" in p) p.price = toNumber(p.price);
            if ("original_price" in p) p.original_price = numOrNullish(p.original_price) ?? null;
        }

        return c as UnknownRow;
    });
}
