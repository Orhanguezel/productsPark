import {
  mysqlTable, varchar, text, tinyint, timestamp,
} from 'drizzle-orm/mysql-core';

export const topbarSettings = mysqlTable('topbar_settings', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  is_active: tinyint('is_active').notNull().default(1),
  message: text('message').notNull(),
  coupon_code: text('coupon_code'),
  link_url: text('link_url'),
  link_text: text('link_text'),
  background_color: text('background_color').default('hsl(var(--primary))'),
  text_color: text('text_color').default('hsl(var(--primary-foreground))'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});


