// =============================================================
// FILE: src/integrations/metahub/db/normalizers/coupons.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, numOrNullish, toBool } from "../../core/normalize";

export function normalizeCouponRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        if ("is_active" in c) {
            const b = toBool(c.is_active);
            if (b !== undefined) c.is_active = b;
        }

        if ("discount_value" in c) c.discount_value = toNumber(c.discount_value);
        if ("max_discount" in c) c.max_discount = numOrNullish(c.max_discount) ?? null;
        if ("min_purchase" in c) c.min_purchase = toNumber(c.min_purchase);
        if (!("min_purchase" in c) && "min_order_total" in c) {
            c.min_purchase = toNumber(c.min_order_total);
        }

        if ("category_ids" in c && typeof c.category_ids === "string") {
            try { c.category_ids = JSON.parse(c.category_ids) as unknown; } catch { /* ignore */ }
        }
        if ("product_ids" in c && typeof c.product_ids === "string") {
            try { c.product_ids = JSON.parse(c.product_ids) as unknown; } catch { /* ignore */ }
        }

        if ("discount_type" in c && typeof c.discount_type === "string") {
            const s = (c.discount_type as string).toLowerCase();
            c.discount_type = s === "percent" ? "percentage" : s === "amount" ? "fixed" : s;
        }

        return c as UnknownRow;
    });
}
