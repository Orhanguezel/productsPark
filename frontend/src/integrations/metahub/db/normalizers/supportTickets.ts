// =============================================================
// FILE: src/integrations/metahub/db/normalizers/supportTickets.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeSupportTicketRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        const cr = c as Record<string, unknown>;

        if (c.user_id === undefined && typeof cr.userId === "string") c.user_id = cr.userId;
        if (c.created_at === undefined && typeof cr.createdAt === "string") c.created_at = cr.createdAt;
        if (c.updated_at === undefined && typeof cr.updatedAt === "string") c.updated_at = cr.updatedAt;

        const s = (c.status as string) ?? "";
        const p = (c.priority as string) ?? "";
        c.status = (s && s.trim()) || "open";
        c.priority = (p && p.trim()) || "medium";

        if (typeof c.category === "undefined") c.category = null;

        return c as UnknownRow;
    });
}
