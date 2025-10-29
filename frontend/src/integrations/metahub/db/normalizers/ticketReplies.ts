// =============================================================
// FILE: src/integrations/metahub/db/normalizers/ticketReplies.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizeTicketReplyRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        const cr = c as Record<string, unknown>;

        if (c.ticket_id === undefined && typeof cr.ticketId === "string") c.ticket_id = cr.ticketId;
        if (c.user_id === undefined && (typeof cr.userId === "string" || cr.userId === null))
            c.user_id = cr.userId as string | null;
        if (c.created_at === undefined && typeof cr.createdAt === "string") c.created_at = cr.createdAt;

        const v = cr.is_admin ?? cr.isAdmin;
        c.is_admin = v === true || v === 1 || v === "1" || v === "true";

        return c as UnknownRow;
    });
}
