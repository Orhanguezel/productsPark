import {
  mysqlTable, char, varchar, mysqlEnum, decimal, int, text, datetime,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// -------------------- ORDERS --------------------
export const orders = mysqlTable('orders', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  order_number: varchar('order_number', { length: 50 }).notNull(),
  user_id: char('user_id', { length: 36 }).notNull(),

  status: mysqlEnum('status', ['pending', 'processing', 'completed', 'cancelled', 'refunded'])
    .notNull().default('pending'),

  payment_method: mysqlEnum('payment_method', ['credit_card', 'bank_transfer', 'wallet', 'paytr', 'shopier'])
    .notNull(),

  payment_status: varchar('payment_status', { length: 50 }).notNull().default('pending'),

  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  coupon_discount: decimal('coupon_discount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  coupon_code: varchar('coupon_code', { length: 50 }),
  notes: text('notes'),
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: varchar('user_agent', { length: 500 }),
  payment_provider: varchar('payment_provider', { length: 50 }),
  payment_id: varchar('payment_id', { length: 255 }),

  created_at: datetime('created_at', { fsp: 0 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // <<< ek: otomatik güncelle
  updated_at: datetime('updated_at', { fsp: 0 }).notNull().$onUpdateFn(() => new Date()),
});

// -------------------- ORDER ITEMS --------------------
export const order_items = mysqlTable('order_items', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  order_id: char('order_id', { length: 36 }).notNull(),
  product_id: char('product_id', { length: 36 }).notNull(),

  product_name: varchar('product_name', { length: 255 }).notNull(),
  quantity: int('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // LONGTEXT + JSON_VALID → text içinde stringify
  options: text('options').$type<any | null>(),

  delivery_status: mysqlEnum('delivery_status', ['pending', 'processing', 'delivered', 'failed'])
    .notNull().default('pending'),

  activation_code: varchar('activation_code', { length: 255 }),
  stock_code: varchar('stock_code', { length: 255 }),
  api_order_id: varchar('api_order_id', { length: 255 }),
  delivered_at: datetime('delivered_at', { fsp: 0 }),

  created_at: datetime('created_at', { fsp: 0 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // <<< ek: otomatik güncelle
  updated_at: datetime('updated_at', { fsp: 0 }).notNull().$onUpdateFn(() => new Date()),
});

// -------------------- RELATIONS --------------------
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(order_items),
}));

export const orderItemsRelations = relations(order_items, ({ one }) => ({
  order: one(orders, {
    fields: [order_items.order_id],
    references: [orders.id],
  }),
}));

export type OrderRow = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItemRow = typeof order_items.$inferSelect;
export type OrderItemInsert = typeof order_items.$inferInsert;
