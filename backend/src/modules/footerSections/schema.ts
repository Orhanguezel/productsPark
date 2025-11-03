// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/schema.ts
// ----------------------------------------------------------------------
import {
  mysqlTable,
  char,
  varchar,
  int,
  boolean,
  datetime,
  text,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * DB şeması:
 * id (char36) | title (varchar100) | links (LONGTEXT JSON_VALID) |
 * order_num (int) | is_active (bool) | created_at | updated_at
 */
export const footerSections = mysqlTable(
  "footer_sections",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    // TEXT / LONGTEXT alanlarında DEFAULT veremiyoruz → controller '[]' yazıyor.
    // SQL tarafında JSON_VALID CHECK ile korunur (migration dosyasında).
    links: text("links").notNull(),
    order_num: int("order_num").notNull().default(0),
    is_active: boolean("is_active").notNull().default(true),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("footer_sections_active_idx").on(t.is_active),
    index("footer_sections_order_idx").on(t.order_num),
    index("footer_sections_created_idx").on(t.created_at),
    index("footer_sections_updated_idx").on(t.updated_at),
  ]
);

export type FooterSectionRow = typeof footerSections.$inferSelect;
export type NewFooterSectionRow = typeof footerSections.$inferInsert;
