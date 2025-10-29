// =============================================================
// FILE: src/integrations/metahub/db/normalizers/orders.ts
// =============================================================
import type { UnknownRow } from "../types";
import { num } from "./_shared";

export function normalizeOrderRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        c.customer_name = typeof c.customer_name === "string" ? c.customer_name : "";
        c.customer_email = typeof c.customer_email === "string" ? c.customer_email : "";
        c.customer_phone = c.customer_phone ?? null;

        const subtotal = num(c["subtotal"] ?? c["total_amount"], 0);
        const discount = num(c["discount"] ?? c["discount_amount"], 0);
        const total = num(c["total"] ?? c["final_amount"], 0);

        c.total_amount = subtotal;
        c.discount_amount = discount;
        c.final_amount = total;

        c.status = typeof c.status === "string" ? c.status : "pending";
        c.payment_status = typeof c.payment_status === "string" ? c.payment_status : "pending";
        c.payment_method = (c.payment_method ?? null) as string | null;

        if (typeof c.notes !== "string") c.notes = c.notes ?? null;

        delete c["subtotal"];
        delete c["discount"];
        delete c["total"];

        return c as UnknownRow;
    });
}
