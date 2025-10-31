// =============================================================
// FILE: src/modules/email-templates/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  tinyint,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const email_templates = mysqlTable(
  "email_templates",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    template_key: varchar("template_key", { length: 100 }).notNull(),
    template_name: varchar("template_name", { length: 150 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    content: text("content").notNull(),      // HTML
    variables: text("variables"),            // JSON-string (string[]) | null
    is_active: tinyint("is_active").notNull().default(1), // 0/1
    locale: varchar("locale", { length: 10 }),            // örn: tr, en-US, null
    created_at: datetime("created_at", { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime("updated_at", { fsp: 0 }).notNull(),
  },
  (t) => ({
    // Aynı locale için aynı key tek olsun. (NULL locale için tekil)
    uxKeyLocale: uniqueIndex("ux_email_tpl_key_locale").on(t.template_key, t.locale),
    ixActive: index("ix_email_tpl_active").on(t.is_active),
    ixUpdated: index("ix_email_tpl_updated_at").on(t.updated_at),
    ixName: index("ix_email_tpl_name").on(t.template_name),
  })
);

export type EmailTemplateRow = typeof email_templates.$inferSelect;
export type EmailTemplateInsert = typeof email_templates.$inferInsert;
