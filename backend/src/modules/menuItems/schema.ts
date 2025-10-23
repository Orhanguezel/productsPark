import {
  mysqlTable, char, varchar, int, boolean, datetime, index
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const menuItems = mysqlTable(
  'menu_items',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    label: varchar('label', { length: 100 }).notNull(),           // FE: title
    url: varchar('url', { length: 500 }).notNull(),               // FE: url (zorunlu)
    parent_id: char('parent_id', { length: 36 }),                 // NULL serbest (nullable için .notNull() yazma)
    order_num: int('order_num').notNull().default(0),             // FE: position & order_num
    is_active: boolean('is_active').notNull().default(true),      // FE: boolean
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
  ]
);

