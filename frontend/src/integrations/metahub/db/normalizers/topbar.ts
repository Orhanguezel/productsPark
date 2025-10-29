// =============================================================
// FILE: src/integrations/metahub/db/normalizers/topbar.ts
// =============================================================
import type { UnknownRow } from "../types";
import { deleteKeyIfExists } from "./_shared";

export function normalizeTopbarRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        c.message = typeof c.text === "string" ? c.text : (c.message ?? "");
        c.link_url = typeof c.link === "string" ? c.link : (c.link_url ?? null);
        if (c.link_url && typeof c.link_text !== "string") c.link_text = "Detaylar";

        if ("is_active" in c) {
            const v = c.is_active;
            c.is_active = v === true || v === 1 || v === "1" || v === "true";
        }
        if ("show_ticker" in c) {
            const v = c.show_ticker;
            c.show_ticker = v === true || v === 1 || v === "1" || v === "true";
        }

        deleteKeyIfExists(c, "text");
        deleteKeyIfExists(c, "link");

        if (!("coupon_code" in c)) c.coupon_code = null;

        return c as UnknownRow;
    });
}
