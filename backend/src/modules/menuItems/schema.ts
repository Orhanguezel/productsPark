import {
  mysqlTable,
  char,
  varchar,
  int,
  boolean,
  datetime,
  index,
  foreignKey,
  // uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const menuItems = mysqlTable(
  'menu_items',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    parent_id: char('parent_id', { length: 36 }),
    order_num: int('order_num').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('menu_items_parent_idx').on(t.parent_id),
    index('menu_items_active_idx').on(t.is_active),
    index('menu_items_order_idx').on(t.order_num),
    index('menu_items_created_idx').on(t.created_at),
    index('menu_items_updated_idx').on(t.updated_at),
    foreignKey({
      columns: [t.parent_id],
      foreignColumns: [t.id],
      name: 'menu_items_parent_fk',
    }).onDelete('set null').onUpdate('cascade'),
    // uniqueIndex('menu_items_parent_order_uq').on(t.parent_id, t.order_num),
  ],
);
