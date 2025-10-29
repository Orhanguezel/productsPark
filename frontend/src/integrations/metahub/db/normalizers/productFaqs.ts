// =============================================================
// FILE: src/integrations/metahub/db/normalizers/productFaqs.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, toBool } from "../../core/normalize";
import { firstDefined } from "./_shared";

export function normalizeProductFaqRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        const order = firstDefined(c, ["display_order", "order_num"]);
        c.display_order = toNumber(order ?? 0);

        if ("is_active" in c) {
            const b = toBool(c.is_active);
            c.is_active = b === undefined ? true : b;
        } else {
            c.is_active = true;
        }

        return c as UnknownRow;
    });
}
