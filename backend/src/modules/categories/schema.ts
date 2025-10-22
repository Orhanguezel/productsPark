import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const categories = mysqlTable(
  'categories',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    image_url: varchar('image_url', { length: 500 }),
    icon: varchar('icon', { length: 100 }),
    parent_id: char('parent_id', { length: 36 }),
    is_featured: tinyint('is_featured').notNull().default(0),
    display_order: int('display_order').notNull().default(0),
    // DB: DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    // DB: DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    // Drizzle "ON UPDATE" deklarasyonunu taşımaz; controller'da da set ediyoruz.
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    categories_slug_idx: index('categories_slug_idx').on(t.slug),
    categories_parent_id_idx: index('categories_parent_id_idx').on(t.parent_id),
    // dump’ta UNIQUE yoktu; istersen:
    // ux_categories_slug: uniqueIndex('ux_categories_slug').on(t.slug),
  }),
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
