import {
  mysqlTable, char, varchar, boolean, datetime, index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const topbarSettings = mysqlTable(
  "topbar_settings",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    text: varchar("text", { length: 255 }).notNull(),
    link: varchar("link", { length: 500 }),
    coupon_id: char("coupon_id", { length: 36 }), // FK -> coupons.id
    is_active: boolean("is_active").notNull().default(false),
    show_ticker: boolean("show_ticker").notNull().default(false),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("topbar_settings_active_idx").on(t.is_active),
    index("topbar_settings_created_idx").on(t.created_at),
    index("topbar_settings_coupon_idx").on(t.coupon_id),
  ]
);

export type TopbarRow = typeof topbarSettings.$inferSelect;
export type NewTopbarRow = typeof topbarSettings.$inferInsert;
