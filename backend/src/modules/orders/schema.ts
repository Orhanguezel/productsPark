// ===================================================================
// FILE: src/modules/orders/schema.ts
// ===================================================================
import {
  mysqlTable, char, varchar, mysqlEnum, decimal, int, text, datetime, index
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// -------------------- ORDERS (DDL EXACT) --------------------
export const orders = mysqlTable("orders", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  order_number: varchar("order_number", { length: 50 }).notNull(),
  user_id: char("user_id", { length: 36 }).notNull(),

  status: mysqlEnum("status", ["pending","processing","completed","cancelled","refunded"])
    .notNull().default("pending"),

  payment_method: mysqlEnum("payment_method", ["credit_card","bank_transfer","wallet","paytr","shopier"])
    .notNull(),

  payment_status: varchar("payment_status", { length: 50 }).notNull().default("pending"),

  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  coupon_discount: decimal("coupon_discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  coupon_code: varchar("coupon_code", { length: 50 }),
  notes: text("notes"),
  ip_address: varchar("ip_address", { length: 50 }),
  user_agent: varchar("user_agent", { length: 500 }),
  payment_provider: varchar("payment_provider", { length: 50 }),
  payment_id: varchar("payment_id", { length: 255 }),

  created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime("updated_at", { fsp: 3 }).notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  index("orders_user_idx").on(t.user_id),
  index("orders_status_idx").on(t.status),
  index("orders_method_idx").on(t.payment_method),
  index("orders_pstatus_idx").on(t.payment_status),
  index("orders_created_idx").on(t.created_at),
]);

// -------------------- ORDER_ITEMS --------------------
export const order_items = mysqlTable("order_items", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  order_id: char("order_id", { length: 36 }).notNull(),
  product_id: char("product_id", { length: 36 }).notNull(),

  product_name: varchar("product_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  options: text("options").$type<string | null>(),

  delivery_status: mysqlEnum("delivery_status", ["pending","processing","delivered","failed"])
    .notNull().default("pending"),

  activation_code: varchar("activation_code", { length: 255 }),
  stock_code: varchar("stock_code", { length: 255 }),
  api_order_id: varchar("api_order_id", { length: 255 }),

  delivery_content: text("delivery_content"),
  turkpin_order_no: varchar("turkpin_order_no", { length: 255 }),

  delivered_at: datetime("delivered_at", { fsp: 3 }),

  created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime("updated_at", { fsp: 3 }).notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  index("oi_order_idx").on(t.order_id),
  index("oi_product_idx").on(t.product_id),
  index("oi_status_idx").on(t.delivery_status),
  index("oi_delivered_idx").on(t.delivered_at),
]);

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

export type OrderRow        = typeof orders.$inferSelect;
export type OrderItemRow    = typeof order_items.$inferSelect;
export type OrderInsert     = typeof orders.$inferInsert;
export type OrderItemInsert = typeof order_items.$inferInsert;
