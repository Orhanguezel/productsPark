import { mysqlTable, char, int, json, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const cartItems = mysqlTable('cart_items', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  user_id: char('user_id', { length: 36 }).notNull(),
  product_id: char('product_id', { length: 36 }).notNull(),
  quantity: int('quantity').notNull().default(1),

  // dump: LONGTEXT + CHECK JSON_VALID(`options`) — app tarafında JSON
  options: json('options'),

  created_at: datetime('created_at', { fsp: 0 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  // NOT NULL & default yok → controller set edecek
  updated_at: datetime('updated_at', { fsp: 0 }).notNull(),
});

export type CartItemRow = typeof cartItems.$inferSelect;
export type CartItemInsert = typeof cartItems.$inferInsert;
