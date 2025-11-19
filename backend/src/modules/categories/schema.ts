// FILE: src/modules/categories/schema.ts
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

    /** Legacy URL alanı (geriye dönük) */
    image_url: varchar("image_url", { length: 500 }),

    /** Storage bağlantısı (yeni) */
    image_asset_id: char("image_asset_id", { length: 36 }),
    image_alt: varchar("image_alt", { length: 255 }),

    icon: varchar("icon", { length: 100 }),
    parent_id: char("parent_id", { length: 36 }),

    // ✅ SEO alanları
    seo_title: varchar("seo_title", { length: 255 }),
    seo_description: varchar("seo_description", { length: 500 }),

    // Yeni alanlar
    article_content: text("article_content"),
    article_enabled: tinyint("article_enabled")
      .notNull()
      .default(0)
      .$type<boolean>(),

    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    is_featured: tinyint("is_featured")
      .notNull()
      .default(0)
      .$type<boolean>(),

    display_order: int("display_order").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$type<string>(),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$type<string>(),
  },
  (t) => [
    uniqueIndex("categories_slug_uq").on(t.slug),
    index("categories_parent_id_idx").on(t.parent_id),
    index("categories_active_idx").on(t.is_active),
    index("categories_order_idx").on(t.display_order),
    index("categories_image_asset_idx").on(t.image_asset_id),
    // İstersen isme göre de ararsın diye:
    // index("categories_seo_title_idx").on(t.seo_title),

    foreignKey({
      columns: [t.parent_id],
      foreignColumns: [t.id],
      name: "fk_categories_parent",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
