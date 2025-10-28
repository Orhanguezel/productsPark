import {
  mysqlTable, varchar, text, tinyint, int, timestamp,
} from 'drizzle-orm/mysql-core';

export const fakeOrderNotifications = mysqlTable('fake_order_notifications', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  product_name: text('product_name').notNull(),
  display_interval: int('display_interval').notNull().default(30), // saniye
  is_active: tinyint('is_active').default(1),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});

