import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  datetime,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/** LONGTEXT custom type (JSON-string: {"html":"..."}) */
const longtext = customType<{ data: string; driverData: string }>({
  dataType() {
    return "longtext";
  },
});

export const customPages = mysqlTable(
  "custom_pages",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    // JSON string: {"html":"..."} — LONGTEXT (JSON_VALID check SQL tarafında)
    content: longtext("content").notNull(),

    // Görsel alanları (blogPosts ile aynı desen)
    /** Eski/serbest URL (geriye dönük uyumluluk) */
    featured_image: varchar("featured_image", { length: 500 }),
    /** Storage bağı: asset id */
    featured_image_asset_id: char("featured_image_asset_id", { length: 36 }),
    /** Erişilebilirlik/SEO alt metni */
    featured_image_alt: varchar("featured_image_alt", { length: 255 }),

    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),
    is_published: tinyint("is_published").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("ux_custom_pages_slug").on(t.slug),
    index("custom_pages_created_idx").on(t.created_at),
    index("custom_pages_updated_idx").on(t.updated_at),
    index("custom_pages_is_published_idx").on(t.is_published),
    index("custom_pages_featured_asset_idx").on(t.featured_image_asset_id),
  ],
);

export type CustomPageRow = typeof customPages.$inferSelect;
export type NewCustomPageRow = typeof customPages.$inferInsert;
