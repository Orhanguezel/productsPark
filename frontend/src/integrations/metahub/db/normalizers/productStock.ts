// =============================================================
// FILE: src/integrations/metahub/db/normalizers/productStock.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toBool } from "../../core/normalize";
import { boolLike } from "./_shared";

export function normalizeProductStockRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        if (typeof c.code !== "string") c.code = String(c.code ?? "");

        const used = toBool(c.is_used);
        c.is_used = used === undefined ? boolLike(c.is_used) : used;

        if (typeof c.used_at !== "string") c.used_at = c.used_at ?? null;
        if (typeof c.order_item_id !== "string")
            c.order_item_id = c.order_item_id ? String(c.order_item_id) : null;

        return c as UnknownRow;
    });
}
