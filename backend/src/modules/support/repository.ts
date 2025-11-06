import { and, desc, asc, eq, like, count, or } from "drizzle-orm";
import { db } from "@/db/client";
import { supportTickets, ticketReplies } from "./schema";
import { randomUUID } from "crypto";

export type Status = "open" | "in_progress" | "waiting_response" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";

export type ListParams = {
  user_id?: string;
  status?: Status;
  priority?: Priority;
  q?: string;
  limit: number;
  offset: number;
  sort: "created_at" | "updated_at"; // query böyle geliyor
  order: "asc" | "desc";
};

const coalesceStatus = (s?: string | null) => (!s || s.trim() === "" ? "open" : s);
const coalescePriority = (p?: string | null) => (!p || p.trim() === "" ? "medium" : p);

export const SupportRepo = {
  async list(params: ListParams) {
    const { user_id, status, priority, q, limit, offset, sort, order } = params;

    const whereClauses = [
      user_id ? eq(supportTickets.userId, user_id) : undefined,
      status ? eq(supportTickets.status, status) : undefined,
      priority ? eq(supportTickets.priority, priority) : undefined,
      q
        ? or(
            like(supportTickets.subject, `%${q}%`),
            like(supportTickets.message, `%${q}%`)
          )
        : undefined,
    ].filter(Boolean) as any[];

    const whereExpr = whereClauses.length ? and(...whereClauses) : undefined;

    const sortCol =
      sort === "created_at" ? supportTickets.createdAt : supportTickets.updatedAt;
    const orderBy = order === "asc" ? asc(sortCol) : desc(sortCol);

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(supportTickets)
        .where(whereExpr)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(supportTickets).where(whereExpr),
    ]);

    const data = rows.map((r) => ({
      ...r,
      status: coalesceStatus(r.status as any),
      priority: coalescePriority(r.priority as any),
    }));

    return { data, total };
  },

  async getById(id: string) {
    const [row] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);
    if (!row) return null;
    return {
      ...row,
      status: coalesceStatus(row.status as any),
      priority: coalescePriority(row.priority as any),
    };
  },

  async createTicket(body: {
    user_id: string;
    subject: string;
    message: string;
    priority?: Priority;
  }) {
    const id = randomUUID();
    const now = new Date();

    const row: typeof supportTickets.$inferInsert = {
      id,
      userId: body.user_id,
      subject: body.subject,
      message: body.message,
      status: "open",
      priority: body.priority ?? "medium",
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(supportTickets).values(row);
    return await this.getById(id);
  },

  async updateTicket(
    id: string,
    patch: Partial<{
      subject: string;
      message: string;
      status: Status;
      priority: Priority;
    }>
  ) {
    const now = new Date();
    await db
      .update(supportTickets)
      .set({ ...patch, updatedAt: now })
      .where(eq(supportTickets.id, id));
    return await this.getById(id);
  },

  async listRepliesByTicket(ticketId: string) {
    const rows = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.ticketId, ticketId))
      .orderBy(asc(ticketReplies.createdAt));
    // tinyint → boolean
    return rows.map((r) => ({ ...r, isAdmin: !!(r.isAdmin as any) }));
  },

  async createReply(body: {
    ticket_id: string;
    user_id?: string | null;
    message: string;
    is_admin?: boolean;
  }) {
    const id = randomUUID();
    const now = new Date();
    const row: typeof ticketReplies.$inferInsert = {
      id,
      ticketId: body.ticket_id,
      userId: body.user_id ?? null,
      message: body.message,
      isAdmin: body.is_admin ? 1 : 0,
      createdAt: now,
    };
    await db.insert(ticketReplies).values(row);
    const [created] = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.id, id))
      .limit(1);
    return { ...created, isAdmin: !!(created.isAdmin as any) };
  },
};
