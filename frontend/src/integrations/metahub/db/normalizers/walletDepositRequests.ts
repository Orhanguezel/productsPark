// =============================================================
// FILE: src/integrations/metahub/db/normalizers/walletDepositRequests.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeWalletDepositRequestRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        if ("amount" in c) c.amount = Number(c.amount);
        if (typeof c.payment_proof !== "string") c.payment_proof = c.payment_proof ?? null;
        if (typeof c.admin_notes !== "string") c.admin_notes = c.admin_notes ?? null;
        if (typeof c.processed_at !== "string") c.processed_at = c.processed_at ?? null;
        if (typeof c.updated_at !== "string") c.updated_at = c.updated_at ?? c.created_at;
        return c as UnknownRow;
    });
}
