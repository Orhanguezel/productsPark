import {
  mysqlTable,
  char,
  varchar,
  mysqlEnum,
  decimal,
  int,
  datetime,
  boolean,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const coupons = mysqlTable('coupons', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  code: varchar('code', { length: 50 }).notNull(),

  discount_type: mysqlEnum('discount_type', ['percentage', 'fixed']).notNull(),
  discount_value: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),

  min_purchase: decimal('min_purchase', { precision: 10, scale: 2 }),
  max_discount: decimal('max_discount', { precision: 10, scale: 2 }),

  usage_limit: int('usage_limit'),
  used_count: int('used_count').notNull().default(0),

  valid_from: datetime('valid_from', { fsp: 0 }),
  valid_until: datetime('valid_until', { fsp: 0 }),

  // tinyint(1) ≅ boolean
  is_active: boolean('is_active').notNull().default(true),

  created_at: datetime('created_at', { fsp: 0 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at', { fsp: 0 }).notNull(),
});

export type CouponRow = typeof coupons.$inferSelect;
export type CouponInsert = typeof coupons.$inferInsert;
