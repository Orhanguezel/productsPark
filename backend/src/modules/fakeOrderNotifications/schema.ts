import { mysqlTable, varchar, text, tinyint, datetime, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const fakeOrderNotifications = mysqlTable(
  "fake_order_notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    product_name: varchar("product_name", { length: 255 }).notNull(),
    customer: varchar("customer", { length: 100 }).notNull(),
    location: varchar("location", { length: 100 }),
    time_ago: varchar("time_ago", { length: 50 }).notNull(),
    is_active: tinyint("is_active").notNull().default(1),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("fake_order_is_active_idx").on(t.is_active),
    index("fake_order_created_idx").on(t.created_at),
  ]
);


export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    is_read: tinyint("is_read").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("notifications_user_idx").on(t.user_id),
    index("notifications_is_read_idx").on(t.is_read),
    index("notifications_created_idx").on(t.created_at),
  ]
);

export type NotificationDbRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;

export type FakeOrderDbRow = typeof fakeOrderNotifications.$inferSelect;
export type NewFakeOrderRow = typeof fakeOrderNotifications.$inferInsert;
