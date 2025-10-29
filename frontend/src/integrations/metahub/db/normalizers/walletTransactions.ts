// =============================================================
// FILE: src/integrations/metahub/db/normalizers/walletTransactions.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeWalletTransactionRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        if ("amount" in c) c.amount = Number(c.amount);
        if (!("description" in c) || typeof c.description !== "string")
            c.description = c.description ?? null;
        if ("order_id" in c && typeof c.order_id !== "string")
            c.order_id = c.order_id ? String(c.order_id) : null;
        return c as UnknownRow;
    });
}
