import {
  mysqlTable, varchar, text, tinyint, int, timestamp,
} from 'drizzle-orm/mysql-core';

export const popups = mysqlTable('popups', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  image_url: text('image_url'),
  product_id: varchar('product_id', { length: 36 }), // FK: products.id (SET NULL)
  coupon_code: text('coupon_code'),
  button_text: text('button_text'),
  button_link: text('button_link'),
  is_active: tinyint('is_active').default(1),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  display_frequency: text('display_frequency').default('always').notNull(), // 'always' vb.
  display_pages: text('display_pages').default('all').notNull(),
  priority: int('priority').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});
