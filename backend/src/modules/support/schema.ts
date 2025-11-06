import {
  mysqlTable,
  char,
  varchar,
  text,
  mysqlEnum,
  datetime,
  tinyint,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const supportTickets = mysqlTable(
  "support_tickets",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    userId: char("user_id", { length: 36 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "waiting_response", "closed"])
      .notNull()
      .default("open"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
      .notNull()
      .default("medium"),
    createdAt: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    // Bazı kurulumlarda default yok → repo/create/update bunu set ediyor.
    updatedAt: datetime("updated_at", { fsp: 3 }).notNull(),
  },
  (t) => [
    index("idx_support_tickets_user").on(t.userId),
    index("idx_support_tickets_created").on(t.createdAt),
    index("idx_support_tickets_updated").on(t.updatedAt),
    index("idx_support_tickets_status").on(t.status),
    index("idx_support_tickets_priority").on(t.priority),
  ],
);

export const ticketReplies = mysqlTable(
  "ticket_replies",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    ticketId: char("ticket_id", { length: 36 }).notNull(),
    userId: char("user_id", { length: 36 }),
    message: text("message").notNull(),
    isAdmin: tinyint("is_admin").notNull().default(0), // 0/1
    createdAt: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("idx_ticket_replies_ticket").on(t.ticketId),
    index("idx_ticket_replies_created").on(t.createdAt),
  ],
);
