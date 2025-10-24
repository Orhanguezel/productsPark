import {
  mysqlTable,
  char,
  varchar,
  int,
  datetime,
  text,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * DB şeması:
 * id (char36) | title (varchar100) | links (longtext JSON_VALID) |
 * order_num (int) | created_at | updated_at
 */
export const footerSections = mysqlTable(
  "footer_sections",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    // DB: longtext + JSON_VALID; Drizzle'da text olarak temsil ediyoruz
    links: text("links").notNull(),
    order_num: int("order_num").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("footer_sections_order_idx").on(t.order_num),
    index("footer_sections_created_idx").on(t.created_at),
  ],
);

export type FooterSectionRow = typeof footerSections.$inferSelect;
export type NewFooterSectionRow = typeof footerSections.$inferInsert;
