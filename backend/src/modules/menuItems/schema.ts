// src/modules/menuItems/schema.ts
import {
  mysqlTable, char, varchar, int, boolean, datetime, index, foreignKey, mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
// import { footerSections } from '@/modules/footerSections/schema'; // varsa FK kur

export const menuItems = mysqlTable(
  'menu_items',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),

    // NEW
    location: mysqlEnum('location', ['header', 'footer']).notNull().default('header'),
    section_id: char('section_id', { length: 36 }), // footer_sections.id (opsiyonel FK)

    // OPTIONAL (Admin UX için yararlı)
    type: mysqlEnum('type', ['page', 'custom']).notNull().default('custom'),
    page_id: char('page_id', { length: 36 }),
    icon: varchar('icon', { length: 64 }),

    parent_id: char('parent_id', { length: 36 }),
    order_num: int('order_num').notNull().default(0),
    is_active: boolean('is_active').notNull().default(true),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('menu_items_location_idx').on(t.location),
    index('menu_items_section_idx').on(t.section_id),
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

    // footerSections şeması import edilebiliyorsa FK aç:
    // foreignKey({
    //   columns: [t.section_id],
    //   foreignColumns: [footerSections.id],
    //   name: 'menu_items_section_fk',
    // }).onDelete('set null').onUpdate('cascade'),
  ],
);


export type MenuItemRow = typeof menuItems.$inferSelect;
export type NewMenuItemRow = typeof menuItems.$inferInsert;
