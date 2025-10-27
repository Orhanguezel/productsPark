// src/db/schema/categories.ts
import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const categories = mysqlTable(
  "categories",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    description: text("description"),
    image_url: varchar("image_url", { length: 500 }),
    icon: varchar("icon", { length: 100 }),
    parent_id: char("parent_id", { length: 36 }),

    // FE: boolean -> DB: TINYINT(1)
    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    is_featured: tinyint("is_featured").notNull().default(0).$type<boolean>(),

    display_order: int("display_order").notNull().default(0),

    // FE string bekliyor → .$type<string>()
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$type<string>(),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$type<string>(),
  },
  (t) => ({
    ux_slug: uniqueIndex("categories_slug_uq").on(t.slug),
    categories_parent_id_idx: index("categories_parent_id_idx").on(t.parent_id),
    categories_active_idx: index("categories_active_idx").on(t.is_active),
    categories_order_idx: index("categories_order_idx").on(t.display_order),

    // Self FK (parent_id -> categories.id)
    fk_categories_parent: foreignKey({
      columns: [t.parent_id],
      foreignColumns: [t.id],
      name: "fk_categories_parent",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  })
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
