// =============================================================
// FILE: src/integrations/metahub/db/normalizers/cartItems.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, numOrNullish } from "../../core/normalize";

export function normalizeCartItemRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        if ("quantity" in c) c.quantity = toNumber(c.quantity);

        if ("selected_options" in c && typeof c.selected_options === "string") {
            try { c.selected_options = JSON.parse(c.selected_options) as unknown; } catch { /* ignore */ }
        }

        if (c.products && typeof c.products === "object") {
            const p = c.products as Record<string, unknown>;
            if ("price" in p) p.price = toNumber(p.price);
            if ("stock_quantity" in p) p.stock_quantity = numOrNullish(p.stock_quantity) ?? null;

            if ("quantity_options" in p && typeof p.quantity_options === "string") {
                try { p.quantity_options = JSON.parse(p.quantity_options) as unknown; } catch {/* ignore */ }
            }
            if ("custom_fields" in p && typeof p.custom_fields === "string") {
                try { p.custom_fields = JSON.parse(p.custom_fields) as unknown; } catch {/* ignore */ }
            }
        }

        return c as UnknownRow;
    });
}
