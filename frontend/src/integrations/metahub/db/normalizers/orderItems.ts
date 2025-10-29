// =============================================================
// FILE: src/integrations/metahub/db/normalizers/orderItems.ts
// =============================================================
import type { UnknownRow } from "../types";
import { num } from "./_shared";

export function normalizeOrderItemRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        const unit = num(c["price"] ?? c["product_price"], 0);
        const ttl = num(c["total"] ?? c["total_price"], 0);

        c.product_price = unit;
        c.total_price = ttl;

        if ("options" in c && typeof c.options === "string") {
            try { c.options = JSON.parse(c.options as string); } catch { /* ignore */ }
        }
        if ("options" in c && c.selected_options === undefined) {
            c.selected_options = c.options as Record<string, string> | null;
        }
        if (c.selected_options === undefined) c.selected_options = null;

        if (typeof c.delivery_status !== "string") c.delivery_status = c.delivery_status ?? "pending";

        return c as UnknownRow;
    });
}
