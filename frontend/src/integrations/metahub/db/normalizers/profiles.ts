// =============================================================
// FILE: src/integrations/metahub/db/normalizers/profiles.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeProfileRows(rows: UnknownRow[]): UnknownRow[] {
    const toNum = (v: unknown): number => {
        if (typeof v === "number") return v;
        if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
        return 0;
    };

    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        if ("wallet_balance" in c) c.wallet_balance = toNum(c.wallet_balance);
        if (c.full_name != null) c.full_name = String(c.full_name);
        if (c.phone != null) c.phone = String(c.phone);
        return c as UnknownRow;
    });
}
