// src/modules/menuItems/schema.ts
import {
  mysqlTable, char, varchar, int, boolean, datetime, index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const menuItems = mysqlTable(
  'menu_items',
  {
    // SQL: CHAR(36) PK NOT NULL
    id: char('id', { length: 36 }).primaryKey().notNull(),

    // SQL: VARCHAR(100) NOT NULL  -- FE: title
    label: varchar('label', { length: 100 }).notNull(),

    // SQL: VARCHAR(500) NOT NULL  -- FE: url
    url: varchar('url', { length: 500 }).notNull(),

    // SQL: CHAR(36) DEFAULT NULL
    parent_id: char('parent_id', { length: 36 }),

    // SQL: INT(11) NOT NULL DEFAULT 0  -- FE: position/display_order
    order_num: int('order_num').notNull().default(0),

    // SQL: TINYINT(1) NOT NULL DEFAULT 1
    is_active: boolean('is_active').notNull().default(true),

    // SQL: DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),

    // SQL: DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    // Drizzle'da DATETIME için "ON UPDATE" doğrudan verilemiyor; app-side sync için $onUpdateFn ekliyoruz.
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // SQL index’leri
    index('menu_items_parent_idx').on(t.parent_id),
    index('menu_items_active_idx').on(t.is_active),
    index('menu_items_order_idx').on(t.order_num),
  ],
);
