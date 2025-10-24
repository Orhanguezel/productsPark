import {
  mysqlTable, char, varchar, decimal, int, datetime, boolean, index, uniqueIndex
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const coupons = mysqlTable(
  "coupons",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    discount_type: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
    discount_value: decimal("discount_value", { precision: 10, scale: 2 }).notNull().default("0.00"),
    min_purchase: decimal("min_purchase", { precision: 10, scale: 2 }),
    max_discount: decimal("max_discount", { precision: 10, scale: 2 }),
    usage_limit: int("usage_limit"),
    used_count: int("used_count").notNull().default(0),
    valid_from: datetime("valid_from", { fsp: 3 }),
    valid_until: datetime("valid_until", { fsp: 3 }),
    is_active: boolean("is_active").notNull().default(true),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull(),
  },
  (t) => [
    uniqueIndex("coupons_code_uq").on(t.code),
    index("coupons_active_idx").on(t.is_active),
    index("coupons_valid_from_idx").on(t.valid_from),
    index("coupons_valid_until_idx").on(t.valid_until),
  ]
);
